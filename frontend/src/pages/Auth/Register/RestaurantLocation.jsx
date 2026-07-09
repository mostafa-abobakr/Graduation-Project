import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AuthContainer from "@/components/AuthContainer";
import { signupValidationSchema } from "@/schemas/auth/validations";
import { useRegisterContext } from "@/contexts/Valdation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MapPin, Building2, Navigation, Map, Maximize2, Minimize2 } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const validationSchema = signupValidationSchema.pick({ address: true, city: true });
const defaultCenter = { lat: 30.0444, lng: 31.2357 };
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const OSM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const OSM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const extractCity = (address) =>
  address.city || address.town || address.village || address.state || "";

const DraggableMarker = ({ position, onDragEnd }) => {
  const map = useMapEvents({});

  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [map, position]);

  return (
    <Marker
      icon={markerIcon}
      draggable
      position={position}
      eventHandlers={{
        dragend: (event) => {
          const { lat, lng } = event.target.getLatLng();
          onDragEnd(lat, lng);
        },
      }}
    />
  );
};

const MapResizer = ({ expanded }) => {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 310)
    return () => clearTimeout(timer)
  }, [expanded, map])
  return null
}

const RestaurantLocation = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)
  const { formData, updateFromData } = useRegisterContext()
  const { register: registerUser, login } = useAuth();

  const { register, handleSubmit, formState: { errors, touchedFields }, setValue, watch } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      address: formData.address || "",
      city: formData.city || "",
    },
    mode: "all",
  });

  const addressValue = watch("address");
  const cityValue = watch("city");

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      updateFromData(values); // 1. Save data to local storage
      const completeData = { ...formData, ...values };
      await registerUser(completeData); // 2. Register
      // await login(completeData.email, completeData.password);
      navigate("/register/connect-pos"); // 3. Navigate
      localStorage.removeItem("register");
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchText = useMemo(
    () => addressValue?.trim() || cityValue?.trim() || "",
    [addressValue, cityValue]
  );

  useEffect(() => {
    if (!isUserTyping || !searchText || searchText.length < 3) {
      setSuggestions([])
      return
    }

    const controller = new AbortController();
    const timerId = setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const response = await fetch(
          `${OSM_SEARCH_URL}?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(searchText)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );
        const data = await response.json();
        const nextSuggestions = Array.isArray(data) ? data : [];
        setSuggestions(nextSuggestions);
        setShowSuggestions(true);
        if (nextSuggestions[0]) {
          const lat = Number(nextSuggestions[0].lat);
          const lng = Number(nextSuggestions[0].lon);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            setMapCenter({ lat, lng });
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setIsSearchingAddress(false);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timerId);
    };
  }, [searchText]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `${OSM_REVERSE_URL}?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      const data = await response.json();
      if (data?.display_name) {
        setValue("address", data.display_name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
      const city = extractCity(data?.address || {});
      if (city) {
        setValue("city", city, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
    } catch {
      // Keep map movement even when reverse geocoding fails.
    }
  };

  const handleSuggestionSelect = (item) => {
    setIsUserTyping(false)
    const lat = Number(item.lat)
    const lng = Number(item.lon)
    setValue("address", item.display_name || "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    const city = extractCity(item.address || {});
    if (city) {
      setValue("city", city, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setMapCenter({ lat, lng });
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleDragEnd = (lat, lng) => {
    setIsUserTyping(false)
    setMapCenter({ lat, lng })
    reverseGeocode(lat, lng)
  }

  const retryGeolocation = () => {
    setIsUserTyping(false)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        setMapCenter({ lat, lng });
        reverseGeocode(lat, lng).finally(() => setIsLocating(false));
      },
      (error) => {
        setSubmitError(getGeolocationErrorMessage(error));
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  };

  const getGeolocationErrorMessage = (error) => {
    if (!error) return "Unable to retrieve your location.";
    if (error.code === error.PERMISSION_DENIED) {
      return "Location permission denied. Allow location access in browser settings.";
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return "Location is unavailable. Try moving to an open area and retry.";
    }
    if (error.code === error.TIMEOUT) {
      return "Location request timed out. Please try again.";
    }
    return "Unable to retrieve your location.";
  };

  const handleLocateMe = () => {
    setIsUserTyping(false)
    if (!window.isSecureContext) {
      setSubmitError("Locate Me works only on HTTPS (or localhost).");
      return;
    }
    if (!navigator.geolocation) {
      setSubmitError("Geolocation is not supported by this browser.");
      return;
    }

    setSubmitError("");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        setMapCenter({ lat, lng });
        reverseGeocode(lat, lng).finally(() => setIsLocating(false));
      },
      (error) => {
        if (error?.code === error.POSITION_UNAVAILABLE || error?.code === error.TIMEOUT) {
          retryGeolocation();
          return;
        }
        setSubmitError(getGeolocationErrorMessage(error));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <AuthContainer
      title="Restaurant Location"
      description="Select your restaurant location"
      className="min-h-0 py-6 bg-transparent w-full"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-[700px] flex flex-col gap-5 bg-card text-card-foreground "
      >
        <div className="space-y-2 relative">
          <Label htmlFor="address" className="font-semibold">
            Search Address
          </Label>
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10 h-8 px-2 text-xs"
              onClick={handleLocateMe}
              disabled={isLocating}
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isLocating ? "Locating..." : "Locate Me"}
            </Button>
          </div>

          <div className="relative flex flex-col gap-2">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-primary z-10 pointer-events-none" />
            <Input
              id="address"
              name="address"
              placeholder="Search and select your address"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem] w-full"
              {...(() => {
                const { onChange, onBlur, name, ref } = register("address");
                return {
                  name,
                  ref,
                  onChange: (event) => {
                    onChange(event);
                    setIsUserTyping(true);
                    setShowSuggestions(true);
                  },
                  onBlur: (event) => {
                    onBlur(event);
                    setShowSuggestions(false);
                  }
                };
              })()}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && (suggestions.length > 0 || isSearchingAddress) && (
              <div className="absolute top-[3.2rem] z-[9999] w-full rounded-md border border-border bg-background shadow-md">
                {isSearchingAddress ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>
                ) : (
                  suggestions.map((item) => (
                    <button
                      key={`${item.place_id}-${item.lat}-${item.lon}`}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/70"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSuggestionSelect(item)}
                    >
                      {item.display_name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {touchedFields.address && errors.address && (
            <p className="text-sm font-medium text-destructive mt-1">{errors.address.message}</p>
          )}

          <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm relative group">
            <div className="absolute top-2 left-2 z-[500] bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-medium text-muted-foreground flex items-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <Map className="w-3 h-3 mr-1" /> Drag pin to adjust
            </div>
            <button
              type="button"
              aria-label={isMapExpanded ? "Collapse map" : "Expand map"}
              onClick={() => setIsMapExpanded((prev) => !prev)}
              className="absolute top-2 right-2 z-[500] bg-background/90 backdrop-blur-sm p-1.5 rounded shadow-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <div style={{ height: isMapExpanded ? "450px" : "250px", transition: "height 0.3s ease", width: "100%" }}>
              <MapContainer
                center={mapCenter}
                zoom={16}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DraggableMarker position={mapCenter} onDragEnd={handleDragEnd} />
                <MapResizer expanded={isMapExpanded} />
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="space-y-2 relative mt-2">
          <Label htmlFor="city" className="font-semibold">
            City
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 w-5 h-5 text-primary z-10" />
            <Input
              id="city"
              name="city"
              placeholder="City"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...register("city")}
            />
          </div>
          {touchedFields.city && errors.city && (
            <p className="text-sm font-medium text-destructive mt-1">{errors.city.message}</p>
          )}
        </div>

        {submitError && (
          <p className="text-destructive font-medium bg-destructive/10 p-3 rounded-md mt-2">
            {submitError}
          </p>
        )}

        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-[1rem] shadow-sm"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="w-full h-12 text-[1rem] shadow-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Next Step"}
          </Button>
        </div>
      </form>
    </AuthContainer>
  )
}

export default RestaurantLocation
