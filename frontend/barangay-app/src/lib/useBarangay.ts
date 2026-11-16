import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@shared/src/services';

/**
 * The signed-in official's barangay, read fresh from `/users/me` so an
 * administrator's reassignment takes effect without signing out.
 */
export function useBarangay() {
  const me = useQuery({ queryKey: ['me'], queryFn: usersApi.me, staleTime: 5 * 60_000 });
  return {
    barangay: me.data?.barangay ?? null,
    isLoading: me.isLoading,
    error: me.error,
    me: me.data,
  };
}
