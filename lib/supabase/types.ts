export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole =
  | "outsider"
  | "runner"
  | "preneur"
  | "member"
  | "admin";

export type ProfileVisibility = "private" | "public";

export type PostType = "news" | "blog";

export type MemberType = "러너" | "프러너" | "alumni";

export type ProjectStatus = "Active" | "Inactive" | "Acquired" | "Public";
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          slug: string;
          role: ProfileRole;
          bio: string;
          photo: string;
          batch: string;
          company: string;
          headline: string;
          current_role: string;
          website_url: string;
          brunch_url: string;
          github_url: string;
          profile_visibility: ProfileVisibility;
          username: string;
          first_name: string;
          last_name: string;
          linkedin_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          role: ProfileRole;
          bio: string;
          photo: string;
          batch: string;
          company: string;
          headline: string;
          current_role: string;
          website_url: string;
          brunch_url: string;
          github_url: string;
          profile_visibility?: ProfileVisibility;
          username: string;
          first_name: string;
          last_name: string;
          linkedin_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          role?: ProfileRole;
          bio?: string;
          photo?: string;
          batch?: string;
          company?: string;
          headline?: string;
          current_role?: string;
          website_url?: string;
          brunch_url?: string;
          github_url?: string;
          profile_visibility?: ProfileVisibility;
          username?: string;
          first_name?: string;
          last_name?: string;
          linkedin_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_experiences: {
        Row: {
          id: string;
          profile_id: string;
          organization: string;
          title: string;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          organization: string;
          title: string;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          description?: string;
          sort_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          organization?: string;
          title?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          content: string;
          type: PostType;
          author_id: string;
          featured: boolean;
          image_url: string;
          published: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt: string;
          content: string;
          type: PostType;
          author_id: string;
          featured?: boolean;
          image_url: string;
          published?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string;
          content?: string;
          type?: PostType;
          author_id?: string;
          featured?: boolean;
          image_url?: string;
          published?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          slug: string;
          label: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label: string;
        };
        Update: {
          id?: string;
          slug?: string;
          label?: string;
        };
        Relationships: [];
      };
      post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          name: string;
          slug: string;
          public_profile_id: string | null;
          student_id: string | null;
          phone: string | null;
          email: string | null;
          major: string | null;
          learner_batch: string | null;
          preneur_batch: string | null;
          batch_tags: string[];
          member_type: MemberType;
          department: string | null;
          role: string | null;
          parts: string[];
          photo_url: string | null;
          linkedin_url: string | null;
          bio: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          public_profile_id?: string | null;
          student_id?: string | null;
          phone?: string | null;
          email?: string | null;
          major?: string | null;
          learner_batch?: string | null;
          preneur_batch?: string | null;
          batch_tags?: string[];
          member_type?: MemberType;
          department?: string | null;
          role?: string | null;
          parts?: string[];
          photo_url?: string | null;
          linkedin_url?: string | null;
          bio?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          public_profile_id?: string | null;
          student_id?: string | null;
          phone?: string | null;
          email?: string | null;
          major?: string | null;
          learner_batch?: string | null;
          preneur_batch?: string | null;
          batch_tags?: string[];
          member_type?: MemberType;
          department?: string | null;
          role?: string | null;
          parts?: string[];
          photo_url?: string | null;
          linkedin_url?: string | null;
          bio?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          one_liner: string | null;
          description: string | null;
          batch: string | null;
          industries: string[];
          region: string | null;
          team_size: number | null;
          is_hiring: boolean;
          status: ProjectStatus;
          website: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          github_url: string | null;
          logo_url: string | null;
          category: string | null;
          founded_year: number | null;
          is_top_company: boolean;
          is_nonprofit: boolean;
          is_women_founded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          one_liner?: string | null;
          description?: string | null;
          batch?: string | null;
          industries?: string[];
          region?: string | null;
          team_size?: number | null;
          is_hiring?: boolean;
          status?: ProjectStatus;
          website?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          github_url?: string | null;
          logo_url?: string | null;
          category?: string | null;
          founded_year?: number | null;
          is_top_company?: boolean;
          is_nonprofit?: boolean;
          is_women_founded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          one_liner?: string | null;
          description?: string | null;
          batch?: string | null;
          industries?: string[];
          region?: string | null;
          team_size?: number | null;
          is_hiring?: boolean;
          status?: ProjectStatus;
          website?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          github_url?: string | null;
          logo_url?: string | null;
          category?: string | null;
          founded_year?: number | null;
          is_top_company?: boolean;
          is_nonprofit?: boolean;
          is_women_founded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      member_projects: {
        Row: {
          member_id: string;
          project_id: string;
          role: string | null;
        };
        Insert: {
          member_id: string;
          project_id: string;
          role?: string | null;
        };
        Update: {
          member_id?: string;
          project_id?: string;
          role?: string | null;
        };
        Relationships: [];
      };
      project_news: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          url: string | null;
          date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          url?: string | null;
          date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          url?: string | null;
          date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          name: string;
          email: string;
          student_id: string | null;
          phone: string | null;
          major: string | null;
          grade: string | null;
          enrollment_status: string | null;
          batch: string;
          introduction: string;
          vision: string | null;
          startup_idea: string | null;
          portfolio_url: string | null;
          equip: boolean;
          photo_exp: boolean;
          design_exp: boolean;
          figma: boolean;
          illustrator: boolean;
          experience_extra: string | null;
          additional_comments: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          student_id?: string | null;
          phone?: string | null;
          major?: string | null;
          grade?: string | null;
          enrollment_status?: string | null;
          batch: string;
          introduction: string;
          vision?: string | null;
          startup_idea?: string | null;
          portfolio_url?: string | null;
          equip?: boolean;
          photo_exp?: boolean;
          design_exp?: boolean;
          figma?: boolean;
          illustrator?: boolean;
          experience_extra?: string | null;
          additional_comments?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          student_id?: string | null;
          phone?: string | null;
          major?: string | null;
          grade?: string | null;
          enrollment_status?: string | null;
          batch?: string;
          introduction?: string;
          vision?: string | null;
          startup_idea?: string | null;
          portfolio_url?: string | null;
          equip?: boolean;
          photo_exp?: boolean;
          design_exp?: boolean;
          figma?: boolean;
          illustrator?: boolean;
          experience_extra?: string | null;
          additional_comments?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      homeworks: {
        Row: {
          id: string;
          title: string;
          individual_content: Json;
          team_content: Json;
          submission_link: string | null;
          padlet_board_id: string | null;
          is_individual: boolean;
          is_team: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          individual_content?: Json;
          team_content?: Json;
          submission_link?: string | null;
          padlet_board_id?: string | null;
          is_individual?: boolean;
          is_team?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          individual_content?: Json;
          team_content?: Json;
          submission_link?: string | null;
          padlet_board_id?: string | null;
          is_individual?: boolean;
          is_team?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      homework_team_assignments: {
        Row: {
          homework_id: string;
          user_id: string;
          team_name: string;
          created_at: string;
        };
        Insert: {
          homework_id: string;
          user_id: string;
          team_name: string;
          created_at?: string;
        };
        Update: {
          homework_id?: string;
          user_id?: string;
          team_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance_sessions: {
        Row: {
          id: string;
          title: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance_logs: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      homework_submissions: {
        Row: {
          id: string;
          homework_id: string;
          user_id: string;
          status: string;
          submission_url: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          homework_id: string;
          user_id: string;
          status?: string;
          submission_url?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          homework_id?: string;
          user_id?: string;
          status?: string;
          submission_url?: string | null;
          submitted_at?: string;
        };
        Relationships: [];
      };
      recruitment_settings: {
        Row: {
          id: string;
          batch: string;
          batch_label: string;
          short_label: string;
          banner_label: string;
          hero_badge: string;
          status: "recruiting" | "reviewing" | "closed" | "upcoming";
          show_banner: boolean;
          timeline_steps: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch: string;
          batch_label: string;
          short_label: string;
          banner_label?: string;
          hero_badge?: string;
          status?: "recruiting" | "reviewing" | "closed" | "upcoming";
          show_banner?: boolean;
          timeline_steps?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          batch?: string;
          batch_label?: string;
          short_label?: string;
          banner_label?: string;
          hero_badge?: string;
          status?: "recruiting" | "reviewing" | "closed" | "upcoming";
          show_banner?: boolean;
          timeline_steps?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recruitment_waitlist: {
        Row: {
          id: string;
          phone: string;
          name: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          category: string;
          label: string;
          description: string | null;
          value_type: string;
          sort_order: number;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: string;
          category?: string;
          label?: string;
          description?: string | null;
          value_type?: string;
          sort_order?: number;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          category?: string;
          label?: string;
          description?: string | null;
          value_type?: string;
          sort_order?: number;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_post_view_count: {
        Args: {
          post_id: string;
        };
        Returns: undefined;
      };
      save_public_profile: {
        Args: {
          input_profile_id: string;
          input_name: string;
          input_headline: string;
          input_current_role: string;
          input_company: string;
          input_bio: string;
          input_linkedin_url: string;
          input_website_url: string;
          input_brunch_url: string;
          input_github_url: string;
          input_profile_visibility: ProfileVisibility;
          input_experiences: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      profile_visibility: ProfileVisibility;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
