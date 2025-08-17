import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768; // 768px
const MOBILE_ASPECT_RATIO = 1.6;

export function useIsMobile(): boolean | null {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT || (window.innerHeight / window.innerWidth) > MOBILE_ASPECT_RATIO : false
    );

    console.info(`useIsMobile: ${isMobile}, window.innerWidth: ${typeof window !== 'undefined' ? window.innerWidth : 'N/A'}, window.innerHeight: ${typeof window !== 'undefined' ? window.innerHeight : 'N/A'}`);

    useEffect(() => {
        function handleResize() {
            setIsMobile(
                window.innerWidth < MOBILE_BREAKPOINT || (window.innerHeight / window.innerWidth) > MOBILE_ASPECT_RATIO
            );
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
}