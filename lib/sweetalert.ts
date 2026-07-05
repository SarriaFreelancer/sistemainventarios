import Swal from 'sweetalert2';

export const brandAlert = Swal.mixin({
  customClass: {
    popup: 'rounded-3xl border border-border bg-card text-foreground font-sans shadow-2xl p-6',
    title: 'text-xl font-bold text-foreground',
    htmlContainer: 'text-sm text-muted-foreground mt-2',
    confirmButton: 'bg-gradient-to-r from-[#B18ACF] to-[#8B5CF6] text-white rounded-xl px-6 py-3 font-semibold text-sm hover:opacity-95 transition active:scale-95 shadow-md shadow-violet-500/20 mr-2',
    cancelButton: 'bg-secondary/10 hover:bg-secondary/20 border border-border text-foreground rounded-xl px-6 py-3 font-semibold text-sm transition active:scale-95 ml-2',
  },
  buttonsStyling: false,
});

export const confirmAction = async (title: string, text: string, confirmText = 'Sí, continuar', cancelText = 'Cancelar') => {
  const result = await brandAlert.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    focusCancel: true,
  });
  return result.isConfirmed;
};

export const successAlert = (title: string, text: string) => {
  brandAlert.fire({
    title,
    text,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
  });
};

export const errorAlert = (title: string, text: string) => {
  brandAlert.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'Entendido',
  });
};

export const warningAlert = (title: string, text: string) => {
  brandAlert.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonText: 'Aceptar',
  });
};

export const infoAlert = (title: string, text: string) => {
  brandAlert.fire({
    title,
    text,
    icon: 'info',
    confirmButtonText: 'Aceptar',
  });
};
