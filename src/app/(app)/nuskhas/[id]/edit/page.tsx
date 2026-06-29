"use client";

import { useParams } from "next/navigation";
import { NuskhaEditClient } from "../../nuskha-edit-client";

export default function EditNuskhaPage() {
  const { id } = useParams<{ id: string }>();
  return <NuskhaEditClient id={id} />;
}
