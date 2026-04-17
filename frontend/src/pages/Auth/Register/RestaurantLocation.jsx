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
import { Loader2 } from "lucide-react";

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
  const { formData, updateFromData } = useRegisterContext();

  const formik = useFormik({
    initialValues: {
      address: formData.address || "",
      city: formData.city || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      updateFromData(values);
      navigate("/register/connect-pos");
      setIsSubmitting(false);
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
    <AuthContainer img={img}>
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        className="w-full max-w-[500px] flex flex-col gap-5 bg-card text-card-foreground p-2 md:p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Step 3: Restaurant Location</h2>

        <div className="space-y-2 relative">
          <Label htmlFor="address" className="font-semibold">Search Address</Label>
          <div className="relative flex flex-col gap-2">
             <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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

          {/* Map Preview */}
          {isLoaded && (
            <div className="mt-2 border border-border/50 rounded-lg overflow-hidden shadow-sm">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={15}
                options={{ disableDefaultUI: true, zoomControl: true }}
              >
                <Marker position={mapCenter} />
              </GoogleMap>
            </div>
          )}
        </div>

        <div className="space-y-2 relative mt-2">
          <Label htmlFor="city" className="font-semibold">City</Label>
          <div className="relative">
             <svg className="absolute left-3 top-3 w-5 h-5 text-primary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
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
