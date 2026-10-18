import { Suspense } from "react";
import { RedirectKarir } from "./RedirectKarir";

// Detail karir ditampilkan di halaman eksplorasi (?id=), jadi rute ini hanya meneruskan.
export default function DetailKarirPage() {
  return (
    <Suspense fallback={null}>
      <RedirectKarir />
    </Suspense>
  );
}
