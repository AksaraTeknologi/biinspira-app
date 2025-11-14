import React, { createContext, useContext, useEffect, useState } from "react";

// 🧩 Hook: deteksi mode mobile
function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean>(
        typeof window !== "undefined" ? window.innerWidth <= 768 : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isMobile;
}

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const isMobile = useIsMobile();
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const effectiveCollapsed = isMobile ? true : isCollapsed;
    const [prevCollapsedBeforeMobile, setPrevCollapsedBeforeMobile] = useState<boolean>(false);

    // 🔹 Saat mount (desktop), ambil dari localStorage
    useEffect(() => {
        if (!isMobile) {
            const stored = localStorage.getItem("sidebarCollapsed");
            if (stored !== null) {
                setIsCollapsed(stored === "true");
                setPrevCollapsedBeforeMobile(stored === "true");
            }
        }
    }, [isMobile]);

    // 🔹 Simpan ke localStorage hanya jika bukan mobile
    useEffect(() => {
        if (!isMobile) {
            localStorage.setItem("sidebarCollapsed", isCollapsed.toString());
        }
    }, [isCollapsed, isMobile]);

    const toggleSidebar = () => {
        // Toggle hanya boleh dilakukan di desktop
        if (!isMobile) {
            setIsCollapsed((prev) => {
                const newVal = !prev;
                localStorage.setItem("sidebarCollapsed", newVal.toString());
                return newVal;
            });
        }
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed: effectiveCollapsed, toggleSidebar, isMobile }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}
