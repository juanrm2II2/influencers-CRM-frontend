import { AuthProvider } from "@/context/AuthContext";
import { render } from "@testing-library/react";

export function renderWithAuth(ui: React.ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}
