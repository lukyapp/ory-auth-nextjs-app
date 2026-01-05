'use client';

import {useEffect, useState} from 'react';

import {generateCsrfCookie} from './csrf-server-tools';

export const useCsrfToken = () => {
    const [token, setToken] = useState<string | undefined>();
    useEffect(() => {
        generateCsrfCookie()
            .then((csrfToken) => setToken(csrfToken))
            .catch(console.log);
    }, []);
    return token;
};
