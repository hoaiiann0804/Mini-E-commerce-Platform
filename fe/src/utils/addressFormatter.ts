export const normalizeAddress = (data: any) => {
  const addr = data.address || {};

  const address1 =
    addr.house_number && addr.road
      ? `${addr.house_number} ${addr.road}`
      : addr.road || addr.pedestrian || addr.path || "";
  const ward =
    addr.suburb ||
    addr.village ||
    addr.hamlet ||
    addr.city_district ||
    addr.neighbourhood ||
    addr.quarter ||
    "";
  let province =
    addr.state ||
    addr.province ||
    addr.region ||
    addr.city ||
    addr.town ||
    addr.country ||
    "";
  if (addr["ISO3166-2-lvl4"] === "VN-SG") {
    province = "Ho Chi Minh City";
  }
  return {
    address1,
    ward,
    province,
    country: addr.country || "Vietnam",
    zip: addr.postcode || "",
    lat: Number(addr.lat),
    lng: Number(addr.lon),
  };
};

export const renderAddress = (addr: any) => {
  return [addr.address1, addr.ward, addr.province, addr.zip, addr.country]
    .filter(Boolean)
    .join(",");
};

const cleanPart = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text) return "";
  const lowered = text.toLowerCase();
  if (lowered === "null" || lowered === "undefined") return "";
  return text;
};

const formatCommaSeparated = (value: unknown) => {
  const text = cleanPart(value);
  if (!text) return "";
  return text
    .split(",")
    .map((part) => cleanPart(part))
    .filter(Boolean)
    .join(", ");
};

export const formatAddressForDisplay = (address: any) => {
  const address1Pretty = formatCommaSeparated(address?.address1);

  // Many records store a full comma-separated address in `address1` already.
  if (address1Pretty.includes(",")) return address1Pretty;

  const ward = cleanPart(address?.ward) || cleanPart(address?.city);
  const province = cleanPart(address?.province) || cleanPart(address?.state);
  const zip = cleanPart(address?.zip);
  const country = cleanPart(address?.country);

  return [cleanPart(address?.address1), ward, province, zip, country]
    .filter(Boolean)
    .join(", ");
};
