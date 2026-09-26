"use client";

import { useQuery } from "@tanstack/react-query";

import { api, unwrap } from "./api/client";

const HOUR = 60 * 60 * 1000;

export const useCategories = () =>
  useQuery({ queryKey: ["catalog", "categories"], queryFn: () => unwrap(api.GET("/catalog/categories")), staleTime: HOUR });

export const useLanguages = () =>
  useQuery({ queryKey: ["catalog", "languages"], queryFn: () => unwrap(api.GET("/catalog/languages")), staleTime: HOUR });

/** Seeded list is small (≈40 cities), so load the top 50 for a select. */
export const useCities = () =>
  useQuery({
    queryKey: ["catalog", "cities"],
    queryFn: () => unwrap(api.GET("/catalog/cities", { params: { query: { limit: 50 } } })),
    staleTime: HOUR,
  });
