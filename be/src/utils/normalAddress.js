const normalAddressData = (data) => {
  return {
    province: data.province || data.state || data.city || null,
    ward: data.ward || null,

      lat: data.lat ?? null,
      lng: data.lng ?? null,

    country: data.country || "vietnam",
  };
};
