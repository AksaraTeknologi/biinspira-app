import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';

export default function useFlashToast() {
    const { flash } = usePage().props as any;
    const shownRef = useRef(false);

    useEffect(() => {
        if (!flash || shownRef.current) return;

        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.warning) toast.warning(flash.warning);
        if (flash.info) toast.message(flash.info);

        // ✅ cegah toast muncul ulang
        shownRef.current = true;
    }, [flash]);
}
