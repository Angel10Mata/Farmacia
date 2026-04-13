import Swal from "sweetalert2";

export const showToast = (
  icon: "success" | "error" | "warning" | "info",
  title: string,
  position:
    | "top"
    | "top-start"
    | "top-end"
    | "center"
    | "bottom"
    | "bottom-start"
    | "bottom-end" = "top-end",
) => {
  const isDark = document.documentElement.classList.contains("dark");
  const Toast = Swal.mixin({
    toast: true,
    position,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: isDark ? "#121212" : "#ffffff",
    color: isDark ? "#fff" : "#09090b",
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = "99999";
      }
    },
  });
  Toast.fire({ icon, title });
};

export const showAlert = (
  icon: "success" | "error" | "warning",
  title: string,
  text: string,
) => {
  const isDark = document.documentElement.classList.contains("dark");
  return Swal.fire({
    icon,
    title,
    text,
    background: isDark ? "#121212" : "#ffffff",
    color: isDark ? "#fff" : "#09090b",
    confirmButtonColor: "#ea580c",
    customClass: {
      popup: "rounded-3xl border border-border/50 backdrop-blur-xl",
    },
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) {
        container.style.zIndex = "99999";
      }
    },
  });
};
