import { tours, hotels } from '@/mocks/data';
import type { Tour, Hotel } from '@/types/domain';
export const catalogService = { listTours: async (): Promise<Tour[]> => [...tours], listHotels: async (): Promise<Hotel[]> => [...hotels] };
