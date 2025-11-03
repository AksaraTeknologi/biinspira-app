import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Facebook, Instagram, Menu } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Home',
        href: '/',
    },
    {
        title: 'Tentang Kami',
        href: '/about',
    },
    {
        title: 'Harga & Katalog',
        href: '/catalog',
    },
    {
        title: 'Info Agen & Reseller',
        href: '/agents',
    },
];

const productVariants = [
    {
        title: 'Varian Asin',
        href: '/products?variant=asin',
        description: 'Kue kering dengan cita rasa gurih yang lezat',
    },
    {
        title: 'Varian Manis',
        href: '/products?variant=manis',
        description: 'Kue kering dengan cita rasa manis yang menggugah selera',
    },
    {
        title: 'Varian Coklat',
        href: '/products?variant=coklat',
        description: 'Kue kering dengan cita rasa coklat premium',
    },
];

const activeItemStyles = 'text-primary';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();

    return (
        <>
            <div className="fixed top-0 right-0 left-0 z-50 bg-secondary/20 backdrop-blur-md">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 h-[34px] w-[34px]">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <img src="/assets/images/logo.webp" alt="Logo Serena Cookies" className="h-12 w-12" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link key={item.title} href={item.href} className="flex items-center space-x-2 font-medium">
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                            <div className="space-y-2">
                                                <p className="font-medium">Produk</p>
                                                <div className="ml-4 space-y-2">
                                                    {productVariants.map((variant) => (
                                                        <Link key={variant.title} href={variant.href} className="block text-sm text-muted-foreground">
                                                            {variant.title}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
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
                    <div className="ml-6 hidden h-full w-full items-center justify-center space-x-2 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch">
                                {/* Regular Menu Items */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <Link
                                        href="/"
                                        className={cn(navigationMenuTriggerStyle(), page.url === '/' && activeItemStyles, 'h-9 cursor-pointer px-3')}
                                    >
                                        Home
                                    </Link>
                                    {page.url === '/' && (
                                        <div className="absolute bottom-4 left-1/2 h-0.5 w-3/4 -translate-x-1/2 bg-primary dark:bg-secondary"></div>
                                    )}
                                </NavigationMenuItem>

                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <Link
                                        href="/about"
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            page.url === '/about' && activeItemStyles,
                                            'h-9 cursor-pointer px-3',
                                        )}
                                    >
                                        Tentang Kami
                                    </Link>
                                    {page.url === '/about' && (
                                        <div className="absolute bottom-4 left-1/2 h-0.5 w-3/4 -translate-x-1/2 bg-primary dark:bg-secondary"></div>
                                    )}
                                </NavigationMenuItem>

                                {/* Products with Dropdown */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuTrigger
                                        className={cn('h-9 cursor-pointer px-3', page.url.startsWith('/products') && activeItemStyles)}
                                    >
                                        Produk
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-3 md:grid-cols-1">
                                            {productVariants.map((variant) => (
                                                <ListItem key={variant.title} title={variant.title} href={variant.href}>
                                                    {variant.description}
                                                </ListItem>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                    {page.url.startsWith('/products') && (
                                        <div className="absolute bottom-4 left-1/2 h-0.5 w-3/4 -translate-x-1/2 bg-primary dark:bg-secondary"></div>
                                    )}
                                </NavigationMenuItem>

                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <Link
                                        href="/catalog"
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            page.url === '/catalog' && activeItemStyles,
                                            'h-9 cursor-pointer px-3',
                                        )}
                                    >
                                        Harga & Katalog
                                    </Link>
                                    {page.url === '/catalog' && (
                                        <div className="absolute bottom-4 left-1/2 h-0.5 w-3/4 -translate-x-1/2 bg-primary dark:bg-secondary"></div>
                                    )}
                                </NavigationMenuItem>

                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <Link
                                        href="/agents"
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            page.url === '/agents' && activeItemStyles,
                                            'h-9 cursor-pointer px-3',
                                        )}
                                    >
                                        Info Agen & Reseller
                                    </Link>
                                    {page.url === '/agents' && (
                                        <div className="absolute bottom-4 left-1/2 h-0.5 w-3/4 -translate-x-1/2 bg-primary dark:bg-secondary"></div>
                                    )}
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        <div className="flex items-center gap-4">
                            <a
                                href="https://www.instagram.com/serenacookiesmalang/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary transition hover:text-primary/80"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.facebook.com/cookiesserena"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary transition hover:text-primary/80"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.tiktok.com/@serenacookiesmalang"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fill-primary transition hover:fill-primary/80"
                            >
                                <svg width="20px" height="20px" viewBox="0 0 512 512" id="icons" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M412.19,118.66a109.27,109.27,0,0,1-9.45-5.5,132.87,132.87,0,0,1-24.27-20.62c-18.1-20.71-24.86-41.72-27.35-56.43h.1C349.14,23.9,350,16,350.13,16H267.69V334.78c0,4.28,0,8.51-.18,12.69,0,.52-.05,1-.08,1.56,0,.23,0,.47-.05.71,0,.06,0,.12,0,.18a70,70,0,0,1-35.22,55.56,68.8,68.8,0,0,1-34.11,9c-38.41,0-69.54-31.32-69.54-70s31.13-70,69.54-70a68.9,68.9,0,0,1,21.41,3.39l.1-83.94a153.14,153.14,0,0,0-118,34.52,161.79,161.79,0,0,0-35.3,43.53c-3.48,6-16.61,30.11-18.2,69.24-1,22.21,5.67,45.22,8.85,54.73v.2c2,5.6,9.75,24.71,22.38,40.82A167.53,167.53,0,0,0,115,470.66v-.2l.2.2C155.11,497.78,199.36,496,199.36,496c7.66-.31,33.32,0,62.46-13.81,32.32-15.31,50.72-38.12,50.72-38.12a158.46,158.46,0,0,0,27.64-45.93c7.46-19.61,9.95-43.13,9.95-52.53V176.49c1,.6,14.32,9.41,14.32,9.41s19.19,12.3,49.13,20.31c21.48,5.7,50.42,6.9,50.42,6.9V131.27C453.86,132.37,433.27,129.17,412.19,118.66Z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="fixed top-16 right-0 left-0 z-40 border-b border-sidebar-border/70 bg-white/80 backdrop-blur-md dark:border-sidebar-border/30 dark:bg-gray-950/80">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}

function ListItem({ title, children, href, ...props }: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
    return (
        <li {...props}>
            <NavigationMenuLink asChild>
                <Link
                    href={href}
                    className="block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                    <div className="text-sm leading-none font-medium">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}
