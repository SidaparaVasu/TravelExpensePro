import { Layout } from "@/components/Layout";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Layout>
      <div className="flex h-96 flex-col items-center justify-center rounded-[10px] bg-white p-8 shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="mt-4 text-lg text-secondary-foreground">
            {description}
          </p>
          <p className="mt-6 text-base text-secondary-foreground">
            This page is under construction. Please continue prompting to add
            content here.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default PlaceholderPage;
