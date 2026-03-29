export type Pin = {
    location_id: number;
    lat: number;
    lng: number;
    country: string;
    adm1: string;
    city: string;
};
  
export type User = {
    user_id: string;
    name: string;
};

export type Album = {
    album_id: number;
    user_id: string;
    caption: string;
    pages: string[];
    start_date: string;
    end_date: string;
    location_id: number;
};