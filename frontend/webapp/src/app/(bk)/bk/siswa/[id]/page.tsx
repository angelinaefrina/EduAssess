import { Suspense } from "react";
import { DetailSiswa } from "./DetailSiswa";

// Data diambil di browser (butuh token Supabase), jadi param dibaca di client component.
export default function BkDetailSiswaPage() {
  return (
    <Suspense fallback={null}>
      <DetailSiswa />
    </Suspense>
  );
}
