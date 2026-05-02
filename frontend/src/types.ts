export type Pin = {
    location_id: number;
    lat: number;
    lng: number;
    country: string;
    adm1: string;
    city: string;
    adm1_name: string | null;
    country_name: string | null;
};

/** Result shape from map search (Nominatim) used when creating albums */
export type SearchLocation = {
    adm1: string | null;
    adm1_name: string | null;
    city: string;
    country: string;
    country_name: string | null;
    lat: number;
    lng: number;
};
  
export type User = {
    user_id: string;
    name: string;
};

export type Page = {
    // cloudinary public id
    id: string;
    caption: string;
}


export type Album = {
    album_id: number;
    user_id: string;
    notes: string;
    pages: Page[]; // order of array = order of pages in album
    start_date: string;
    end_date: string;
    location_id: number;
    name: string;
    created_at: string;
    /** Present on feed rows from get_friends_albums */
    friend_name?: string;
    location_city?: string;
    location_adm1?: string;
    location_country?: string;
};

export type Color = {
    color: string;
    user_id: string;
    region_code: string;
    region_type: string;
    display_name: string | null;
    country_name: string | null;
};

export type FriendRequest = {
    sender_id: string;
    name: string;
};

export type SentRequest = {
    receiver_id: string;
    name: string;
};