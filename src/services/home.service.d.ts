export declare class HomeService {
    static getHeroData(): Promise<{
        title: string;
        description: string;
        heroImage: string;
        exploreUrl: string;
    }>;
    static getCategories(): Promise<any>;
    static getFeaturedCourses(): Promise<any>;
    static getTopInstructors(): Promise<any>;
    static getTestimonials(): Promise<any>;
    static getStatistics(): Promise<{
        totalUsers: any;
        totalCourses: any;
        totalEnrollments: any;
    }>;
    static getFAQ(): Promise<{
        question: string;
        answer: string;
    }[]>;
    static getFooter(): Promise<{
        logo: string;
        description: string;
        socialLinks: {
            facebook: string;
            twitter: string;
            linkedin: string;
        };
    }>;
}
//# sourceMappingURL=home.service.d.ts.map