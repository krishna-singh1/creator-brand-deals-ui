"use client";

import { useQuery } from "@tanstack/react-query";

import { api, type components, unwrap } from "./api/client";

export type BrandProfile = components["schemas"]["BrandProfile"];
export type BrandVerificationStatus = components["schemas"]["BrandVerificationStatus"];

/** The signed-in brand's profile (shared with the profile page's cache). */
export const useBrandProfile = () => useQuery({ queryKey: ["brand", "profile"], queryFn: () => unwrap(api.GET("/brand/profile")) });

/** Only verified brands can publish campaigns or invite creators (the API enforces this). */
export const isVerified = (p?: BrandProfile) => p?.verificationStatus === "VERIFIED";
