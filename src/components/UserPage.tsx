import { useState, useEffect } from 'react'

export default function UserPage() {
    const [user, getUser] = useState([]);
    const [albums, getAlbums] = useState([]);
    const testUser = "0000"
    useEffect(() => {
        fetch(`http://localhost:5001/get_user?user_id=${testUser}`).then(res => res.json()).then(data => {
        getUser(data.db_response);
        });
    }, []);
    useEffect(() => {
        fetch(`http://localhost:5001/get_albums?user_id=${testUser}`).then(res => res.json()).then(data => {
        getAlbums(data.db_response);
        });
    }, []);

    return (
        <div>
            <h1 className="text-lg font-bold px-4 pt-4">{testUser}'s User Page</h1>
            <p className="px-4 pt-4">Name: {user[0]?.name}</p>
            <p className="px-4 pt-4">Albums: {albums.length}</p>
            <p className="px-4">Album captions: {albums.map((album, i) => <span key={i}>{album.caption} </span>)}</p>

        </div>
    )
}