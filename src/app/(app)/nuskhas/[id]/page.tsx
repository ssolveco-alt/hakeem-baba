"use client";

import { useParams } from "next/navigation";
import { NuskhaDetailsClient } from "../nuskha-details-client";

export default function NuskhaDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return <NuskhaDetailsClient id={id} />;
}
