import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Home, Menu, Phone, Users } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Beranda',
        href: '/',
    },
];

const mobileNavItems = [
    {
        title: 'Beranda',
        href: '/',
        icon: Home,
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'Kontak',
        href: 'https://wa.me/6281234567890',
        icon: Phone,
    },
];

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();

    const navItems = auth?.user ? mainNavItems : mainNavItems.filter((item) => item.href !== '/profile');
    return (
        <>
            <div className="fixed top-0 right-0 left-0 z-50 border-b border-sidebar-border/80 shadow-xs backdrop-blur-2xl">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 h-[34px] w-[34px] hover:bg-transparent">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-gradient-to-br from-[#E5EDE3] to-[#F6F0E2]"
                            >
                                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <img src="/assets/images/logo-kemenag.png" alt="Logo Kementrian Agama Kab. Malang" className="block w-12" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {navItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className={cn(
                                                        'flex items-center space-x-2 rounded-md px-3 py-2 font-medium',
                                                        page.url === item.href
                                                            ? 'bg-primary text-black'
                                                            : 'bg-primary/20 hover:bg-primary/50 hover:text-accent-foreground focus:bg-primary/50 focus:text-accent-foreground',
                                                    )}
                                                >
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="flex flex-col space-y-4">
                                            {rightNavItems.map((item) => (
                                                <a
                                                    key={item.title}
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                    <span>{item.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link href="/" prefetch className="flex items-center space-x-2">
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-auto flex items-center space-x-4">
                        <NavigationMenu className="hidden h-full items-stretch md:flex">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => {
                                    const isActive = item.href === '/' ? page.url === '/' : page.url.startsWith(item.href) && item.href !== '/';
                                    return (
                                        <NavigationMenuItem key={index} className="relative flex h-full items-center">
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    navigationMenuTriggerStyle(),
                                                    isActive && 'bg-primary text-primary-foreground',
                                                    'h-9 cursor-pointer px-3',
                                                )}
                                            >
                                                {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />}
                                                {item.title}
                                            </Link>
                                            {isActive && (
                                                <div className="absolute -bottom-3 left-1/2 h-0.5 w-full -translate-x-1/2 translate-y-px bg-primary-foreground dark:bg-white"></div>
                                            )}
                                        </NavigationMenuItem>
                                    );
                                })}
                                {auth.user && (
                                    <NavigationMenuItem className="relative flex h-full items-center">
                                        <Link
                                            href="/profile"
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                page.url.startsWith('/profile') && 'text-primary-foreground',
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            Bimbingan
                                        </Link>
                                        {page.url.startsWith('/profile') && (
                                            <div className="absolute -bottom-3 left-1/2 h-0.5 w-full -translate-x-1/2 translate-y-px bg-primary-foreground dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                )}
                            </NavigationMenuList>
                        </NavigationMenu>
                        {auth.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="size-10 rounded-full p-1">
                                        <Avatar className="size-8 overflow-hidden rounded-full">
                                            <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                            <AvatarFallback className="rounded-lg bg-primary text-black dark:bg-neutral-700 dark:text-white">
                                                {getInitials(auth.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-gradient-to-br from-[#E5EDE3] to-[#F6F0E2]" align="end">
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Button variant="secondary" asChild>
                                    <Link href={route('login')}>Masuk</Link>
                                </Button>
                                {/* <Button variant="default" asChild className="hidden md:inline-flex">
                                    <Link href={route('register')}>Daftar Sekarang</Link>
                                </Button> */}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Dock */}
            <div className="fixed right-0 bottom-0 left-0 z-50 md:hidden">
                <div className="border-t border-border bg-primary/50 pb-2 shadow-lg backdrop-blur-md">
                    <div className={`grid gap-1 px-2 py-2 ${auth.user ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        {mobileNavItems.map((item) => {
                            const isActive = item.href === '/' ? page.url === '/' : page.url.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex flex-col items-center justify-center rounded-lg px-2 py-3 transition-colors duration-200',
                                        isActive
                                            ? 'bg-primary-foreground/10 text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                    )}
                                >
                                    <Icon iconNode={item.icon ?? Home} className="mb-1 h-5 w-6" />
                                    <span className="text-center text-xs leading-none font-medium">{item.title}</span>
                                </Link>
                            );
                        })}

                        {auth.user &&
                            (() => {
                                const isActive = page.url.startsWith('/profile');
                                return (
                                    <Link
                                        key="/profile"
                                        href="/profile"
                                        className={cn(
                                            'flex flex-col items-center justify-center rounded-lg px-2 py-3 transition-colors duration-200',
                                            isActive
                                                ? 'bg-primary-foreground/10 text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                        )}
                                    >
                                        <Users className="mb-1 h-5 w-6" />
                                        <span className="text-center text-xs leading-none font-medium">Bimbingan</span>
                                    </Link>
                                );
                            })()}
                    </div>
                </div>
            </div>

            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
