import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Drift Positions | TrackWise",
    description: "View Drift Protocol positions, balances, and subaccounts",
};

export default function CryptoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
