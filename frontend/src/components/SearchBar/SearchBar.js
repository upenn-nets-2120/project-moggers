import React, { useState } from 'react';
import axios from 'axios';
import config from '../../serverConfig.json';
import styles from './SearchBar.module.css';

function SearchBar({ onSearch }) {
    const [query, setQuery] = useState('');
    const [queryDisplay, setQueryDisplay] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${config.serverRootURL}/searchPosts`, { params: { q: query } });
            onSearch(response.data.results);
            setQueryDisplay(query);
            setQuery('');
        } catch (error) {
            console.error('Error searching posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <div className={styles.searchBar}>
            <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.input}
            />
            <button onClick={handleSearch} className={styles.button}>
            {isLoading ? 'Loading...' : 'Search'}
            </button>
        </div>
        {queryDisplay.length > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '10px' }}><b>Query</b>: {queryDisplay}</div>
        )}
        </>
    );
}

export default SearchBar;
