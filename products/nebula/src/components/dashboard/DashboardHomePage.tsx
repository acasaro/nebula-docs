import { ArrowRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
  ActivitySection,
  DashboardHeader,
  DeploymentHeroCard,
  type DashboardTab,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoader } from "@/components/ui/PageLoader";
import { useDashboardData } from "@/lib/dashboard";

export function DashboardHomePage() {
  const data = useDashboardData();
  const [tab, setTab] = useState<DashboardTab>("live");

  if (data.status === "loading") {
    return (
      <div className='mx-auto flex max-w-5xl justify-center py-16'>
        <PageLoader size={48} />
      </div>
    );
  }

  if (data.status === "no-repo") {
    return (
      <div className='mx-auto flex max-w-3xl flex-col gap-6'>
        <DashboardHeader />
        <Card>
          <CardHeader>
            <CardTitle>No docs repo connected</CardTitle>
            <CardDescription>
              Install the GitHub app on a repo, then pick which one to edit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to='/settings/github-app'>
                Get started
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className='mx-auto flex max-w-3xl flex-col gap-6'>
        <DashboardHeader />
        <Card>
          <CardHeader>
            <CardTitle>Couldn't load dashboard</CardTitle>
            <CardDescription>{data.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' onClick={data.refresh}>
              <RefreshCw />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-10'>
      <DashboardHeader />
      <DeploymentHeroCard
        deployment={data.data.deployment}
        onRefresh={data.refresh}
      />
      <ActivitySection
        tab={tab}
        onTabChange={setTab}
        deployment={data.data.deployment}
        activity={data.data.activity}
        previews={data.data.previews}
      />
    </div>
  );
}
