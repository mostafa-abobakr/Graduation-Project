import React, { useState, useCallback } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";

import AuthContainer from "@/components/AuthContainer";
import img from "@/assets/Auth/SignUp.png";
import { signupValidationSchema } from "@/schemas/auth/validations";
import { useRegisterContext } from "@/contexts/Valdation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MapPin, Building2, Navigation, Map } from "lucide-react";

const validationSchema = signupValidationSchema.pick(["address", "city"]);

const libraries = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "250px",
  borderRadius: "0.5rem",
};

const defaultCenter = {
  lat: 30.0444, // Cairo default
  lng: 31.2357
};

const RestaurantLocation = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { formData, updateFromData, resetFormData } = useRegisterContext();
  const { register } = useAuth();

  const formik = useFormik({
    initialValues: {
      address: formData.address || "",
      city: formData.city || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSubmitError("");
      try {
        // Merge location data with existing form data
        const completeData = { ...formData, ...values };
        
        // Call register API with ALL data
        await register(completeData);
        
        // Clear localStorage on success
        resetFormData();
        
        // Navigate to next step
        navigate("/register/connect-pos");
      } catch (error) {
        setSubmitError(error.response?.data?.message || "Registration failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Google Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [autocomplete, setAutocomplete] = useState(null);
  const [geocoder, setGeocoder] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const lastGeocodedQueryRef = React.useRef("");

  React.useEffect(() => {
    if (isLoaded && !geocoder && window.google) {
      setGeocoder(new window.google.maps.Geocoder());
    }
  }, [isLoaded, geocoder]);

  React.useEffect(() => {
    if (!isLoaded || !geocoder) return;

    const address = formik.values.address?.trim();
    const city = formik.values.city?.trim();
    const searchQuery = city
      ? (address ? `${address}, ${city}` : city)
      : address;

    if (!searchQuery || searchQuery === lastGeocodedQueryRef.current) return;

    const debounceId = setTimeout(() => {
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === "OK" && results?.[0]?.geometry?.location) {
          const location = results[0].geometry.location;
          setMapCenter({ lat: location.lat(), lng: location.lng() });
          lastGeocodedQueryRef.current = searchQuery;
        }
      });
    }, 600);

    return () => clearTimeout(debounceId);
  }, [formik.values.address, formik.values.city, geocoder, isLoaded]);

  const reverseGeocode = (lat, lng) => {
    return new Promise((resolve) => {
      if (!geocoder) return resolve();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          const place = results[0];
          formik.setFieldValue("address", place.formatted_address);

          const cityComp = place.address_components?.find((c) =>
            c.types.includes("locality") ||
            c.types.includes("administrative_area_level_2") ||
            c.types.includes("administrative_area_level_1")
          );
          if (cityComp) {
            formik.setFieldValue("city", cityComp.long_name);
          }
        }
        resolve();
      });
    });
  };

  const handleDragEnd = (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setMapCenter({ lat: newLat, lng: newLng });
    reverseGeocode(newLat, newLng);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter({ lat, lng });
          reverseGeocode(lat, lng).finally(() => setIsLocating(false));
        },
        () => {
          setSubmitError("Unable to retrieve your location.");
          setIsLocating(false);
        }
      );
    } else {
      setSubmitError("Geolocation is not supported by this browser.");
    }
  };

  const onLoadAutocomplete = useCallback((autocompleteObj) => {
    setAutocomplete(autocompleteObj);
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMapCenter({ lat, lng });

        // Auto-fill address and city
        formik.setFieldValue("address", place.formatted_address || place.name);

        const cityComp = place.address_components?.find((c) =>
          c.types.includes("locality")
        );
        if (cityComp) {
          formik.setFieldValue("city", cityComp.long_name);
        }
      }
    }
  };

  return (
    <AuthContainer
      title="Restaurant Location"
      description="Select your restaurant location"
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    >
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        className="w-full max-w-[700px] flex flex-col gap-5 bg-card text-card-foreground p-2 md:p-6"
      >
        

        <div className="space-y-2 relative">
          <Label htmlFor="address" className="font-semibold">Search Address</Label>
          <div className="relative flex flex-col gap-2">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-primary z-10" />
            {isLoaded ? (
              <Autocomplete
                onLoad={onLoadAutocomplete}
                onPlaceChanged={onPlaceChanged}
                className="w-full"
              >
                <Input
                  id="address"
                  name="address"
                  placeholder="Search and select your address"
                  className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem] w-full"
                  {...formik.getFieldProps("address")}
                />
              </Autocomplete>
            ) : (
              <Input
                id="address"
                name="address"
                placeholder="Address"
                className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
                {...formik.getFieldProps("address")}
              />
            )}
          </div>
          {formik.touched.address && formik.errors.address && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.address}</p>}

          {/* Locate Me Button */}
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10 h-8 px-2 text-xs"
              onClick={handleLocateMe}
              disabled={isLocating}
            >
              {isLocating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 mr-1.5" />}
              {isLocating ? "Locating..." : "Locate Me"}
            </Button>
          </div>

          {/* Map Preview */}
          {isLoaded ? (
            <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm relative group">
              <div className="absolute top-2 left-2 z-10 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-medium text-muted-foreground flex items-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Map className="w-3 h-3 mr-1" /> Drag pin to adjust
              </div>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={16}
                options={{ disableDefaultUI: true, zoomControl: true }}
              >
                <Marker
                  position={mapCenter}
                  draggable={true}
                  onDragEnd={handleDragEnd}
                />
              </GoogleMap>
            </div>
          ) : (
            <div className="h-[250px] w-full bg-muted/40 animate-pulse rounded-lg border border-border/50 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="space-y-2 relative mt-2">
          <Label htmlFor="city" className="font-semibold">City</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 w-5 h-5 text-primary z-10" />
            <Input
              id="city"
              name="city"
              placeholder="City"
              className="pl-[2.5rem] bg-muted/20 border-border/80 h-[3rem]"
              {...formik.getFieldProps("city")}
            />
          </div>
          {formik.touched.city && formik.errors.city && <p className="text-sm font-medium text-destructive mt-1">{formik.errors.city}</p>}
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
          <Button type="submit" className="w-full h-12 text-[1rem] shadow-md" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Next Step"}
          </Button>
        </div>
      </form>
    </AuthContainer>
  );
};

export default RestaurantLocation;
