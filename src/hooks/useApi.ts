import api from "../services/api.ts";
import {useMutation, type UseMutationResult, useQuery} from "@tanstack/react-query";

export const useApi = () => {
  const fetchData = async (url: string) => {
    const response = await api.get(url);
    return response.data;
  }
  const postData = async ({url, data}: { url: string, data: any }) => {
    const response = await api.post(url, data);
    return response.data;
  }

  return {
    useGet: <T = unknown>(url: string) =>
      useQuery<T, Error>({
        queryKey: [url],
        queryFn: () => fetchData(url),
      }),

    usePost: (): UseMutationResult<any, Error, { url: string; data: any }> =>
      useMutation({
        mutationFn: postData,
      }),
  };
};
