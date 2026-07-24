import Swal from "sweetalert2";
import { getSwalThemeOpts } from "@/lib/utils";

export const MODAL_ACTION_ERRORS = {
  UNAUTHORIZED: "No autorizado. Inicie sesión nuevamente.",
  VALIDATION: "Revisa los datos del formulario.",
  NOT_FOUND: "El registro no fue encontrado.",
  INTERNAL: "Error interno, inténtelo más tarde.",
};

export function modalActionMessage(code: keyof typeof MODAL_ACTION_ERRORS | string, fallback: string = "Ha ocurrido un error.") {
  const msg = MODAL_ACTION_ERRORS[code as keyof typeof MODAL_ACTION_ERRORS] || fallback;
  if (code === "UNAUTHORIZED" || code === "INTERNAL") {
    Swal.fire({ title: "Error", text: msg, icon: "error", ...getSwalThemeOpts() });
  } else if (code === "VALIDATION") {
    Swal.fire({ title: "Atención", text: msg, icon: "warning", ...getSwalThemeOpts() });
  } else {
    Swal.fire({ title: "Atención", text: msg, icon: "warning", ...getSwalThemeOpts() });
  }
}
