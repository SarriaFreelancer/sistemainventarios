"use client";

import { useEffect, useState } from "react";
import { getActiveAnnouncements } from "@/app/actions/announcement-actions";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";

export function GlobalAnnouncer() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnnouncements() {
      const res = await getActiveAnnouncements();
      if (res.success && res.data && res.data.length > 0) {
        // Filter out those already dismissed in localStorage
        const dismissed = JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
        const activeAndUnseen = res.data.filter((a: any) => !dismissed.includes(a.id));
        
        if (activeAndUnseen.length > 0) {
          setAnnouncements(activeAndUnseen);
          // Show SweetAlert dynamically
          const Swal = (await import("sweetalert2")).default;
          
          for (const announcement of activeAndUnseen) {
            let icon: any = 'info';
            let iconHtml = '';
            
            if (announcement.type === 'WARNING') icon = 'warning';
            if (announcement.type === 'URGENT') icon = 'error';

            await Swal.fire({
              title: announcement.title,
              html: `<div class="text-left">${announcement.message.replace(/\\n/g, '<br/>')}</div>`,
              icon,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#0f172a',
              allowOutsideClick: false,
              allowEscapeKey: false
            });
            
            // Mark as dismissed
            const currentDismissed = JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
            currentDismissed.push(announcement.id);
            localStorage.setItem("dismissed_announcements", JSON.stringify(currentDismissed));
          }
        }
      }
    }

    fetchAnnouncements();
  }, []);

  return null; // This component is invisible
}
