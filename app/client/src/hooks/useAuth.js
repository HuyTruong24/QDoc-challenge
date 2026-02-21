// web/src/hooks/useAuth.js
import { useAuthContext } from "../context/AuthContext";
export function useAuth() {
  return useAuthContext();
}