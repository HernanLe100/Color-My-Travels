export type Pin = {
    location_id: number;
    lat: number;
    lng: number;
    country: string;
    adm1: string;
    city: string;
};

/** Result shape from map search (Nominatim) used when creating albums */
export type SearchLocation = {
    adm1: string | null;
    city: string;
    country: string;
    lat: number;
    lng: number;
    state: string | null;
};
  
export type User = {
    user_id: string;
    name: string;
};

export type Album = {
    album_id: number;
    user_id: string;
    notes: string;
    pages: string[];
    start_date: string;
    end_date: string;
    location_id: number;
    name: string;
};

export type Color = {
    color: string;
    user_id: string;
    region_code: string;
    region_type: string;
};