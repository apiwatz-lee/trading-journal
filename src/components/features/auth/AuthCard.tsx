import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  footerText: string;
  footerLinkLabel: string;
  footerHref: string;
  children: React.ReactNode;
}

/** Shared chrome for the login / register screens. */
export function AuthCard({
  title,
  description,
  footerText,
  footerLinkLabel,
  footerHref,
  children,
}: AuthCardProps) {
  return (
    <Card className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 ring-0 [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="justify-center border-zinc-800 bg-zinc-900/60 text-sm text-zinc-400">
        {footerText}{" "}
        <Link
          href={footerHref}
          className="ml-1 font-medium text-emerald-400 transition-colors duration-200 hover:text-emerald-300"
        >
          {footerLinkLabel}
        </Link>
      </CardFooter>
    </Card>
  );
}
