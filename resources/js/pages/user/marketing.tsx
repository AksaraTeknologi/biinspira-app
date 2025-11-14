'use client';

import DeleteButton from '@/components/delete-button';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { Pencil } from 'lucide-react';

interface Event {
  id: number;
  name: string;
  batch: string;
}

interface User {
  id: number;
  name: string;
}

interface Goal {
  id: number;
  name: string;
}

interface Platform {
  id: number;
  name: string;
}

interface PlanPlatform {
  id: number;
  start_date: string;
  end_date: string;
  audience_type: string;
  goal: Goal;
  platform: Platform;
}

interface AdPlan {
  id: number;
  user: User;
  event: Event;
  status: string;
  plan_platforms: PlanPlatform[];
}

const breadcrumbs = [{ title: 'Marketing', href: route('user.marketing.index') }];

export default function Marketing() {
  const { adPlans = [], isAdmin } = usePage<{ adPlans?: AdPlan[]; isAdmin?: boolean }>().props;
  const userAdPlans = adPlans;
  const handleAddAd = () => {
    router.visit(route(isAdmin ? 'admin.marketing.create' : 'user.marketing.create'));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Daftar Iklan</h1>
          <Button
            onClick={handleAddAd}
            className="gap-2 bg-primary hover:bg-blue-700 dark:bg-background dark:hover:bg-blue-900 dark:border dark:border-primary"
          >
            + Tambah Iklan
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border shadow-sm">
          <Table>
            <TableHeader className="bg-border">
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Tipe Audiens</TableHead>
                <TableHead>Tanggal Berakhir</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-input">
              {userAdPlans.length > 0 ? (
                userAdPlans.map(plan => {
                  const platforms = plan.plan_platforms.map(p => p.platform?.name).join(', ');
                  const goals = plan.plan_platforms.map(p => p.goal?.name).join(', ');
                  const audienceTypes = [
                    ...new Set(
                      plan.plan_platforms.map(p =>
                        p.audience_type === 'targeted'
                          ? 'Targetting Audiens'
                          : p.audience_type === 'broad'
                            ? 'Broad'
                            : p.audience_type === 'combined'
                              ? 'Combined'
                              : '-'
                      )
                    )
                  ].join(', ');
                  const endDates = plan.plan_platforms.map(p => formatDate(p.end_date)).join(', ');

                  return (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.event?.name || '-'}</TableCell>
                      <TableCell>{plan.event?.batch || '-'}</TableCell>
                      <TableCell>{platforms || '-'}</TableCell>
                      <TableCell>{goals || '-'}</TableCell>
                      <TableCell>{audienceTypes || '-'}</TableCell>
                      <TableCell>{endDates || '-'}</TableCell>
                      <TableCell>{plan.user?.name || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            plan.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : plan.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {plan.status || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={route(isAdmin ? 'admin.marketing.edit' : 'user.marketing.edit', plan.id)}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteButton id={plan.id} routeTable="marketing" name={plan.event?.name} role='user'/>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-6 text-center text-gray-500">
                    Tidak ada data iklan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
