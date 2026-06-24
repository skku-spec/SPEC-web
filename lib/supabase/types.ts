export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole =
  | "outsider"
  | "learner"
  | "alumni"
  | "preneur";

export type ProfileVisibility = "private" | "public";

export type PostType = "news" | "blog";

export type MemberType = "러너" | "프러너" | "alumni";

export type ProjectStatus = "Active" | "Inactive" | "Acquired" | "Public";
export type TeamKpiStatus = "planned" | "in_progress" | "achieved" | "missed" | "blocked";
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
          is_admin: boolean;
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
          is_admin?: boolean;
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
          is_admin?: boolean;
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
          first_name: string | null;
          last_name: string | null;
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
          first_name?: string | null;
          last_name?: string | null;
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
          first_name?: string | null;
          last_name?: string | null;
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
      ideathon_ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          target_customer: string | null;
          competitors: string | null;
          market_size: string | null;
          team_members: string | null;
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          target_customer?: string | null;
          competitors?: string | null;
          market_size?: string | null;
          team_members?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          target_customer?: string | null;
          competitors?: string | null;
          market_size?: string | null;
          team_members?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ideathon_ideas_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ideathon_participant_profiles: {
        Row: {
          id: string;
          user_id: string;
          photo_url: string;
          department: string;
          major: string | null;
          age: number;
          student_id: string;
          grade: string;
          ability_tags: string[];
          interest_tags: string[];
          startup_reason: string;
          team_style: string;
          december_goal: string;
          looking_for_teammates: string;
          appeal: string | null;
          portfolio_url: string | null;
          sns_url: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_url: string;
          department: string;
          major?: string | null;
          age: number;
          student_id: string;
          grade: string;
          ability_tags: readonly string[];
          interest_tags?: readonly string[];
          startup_reason: string;
          team_style: string;
          december_goal: string;
          looking_for_teammates: string;
          appeal?: string | null;
          portfolio_url?: string | null;
          sns_url?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          photo_url?: string;
          department?: string;
          major?: string | null;
          age?: number;
          student_id?: string;
          grade?: string;
          ability_tags?: readonly string[];
          interest_tags?: readonly string[];
          startup_reason?: string;
          team_style?: string;
          december_goal?: string;
          looking_for_teammates?: string;
          appeal?: string | null;
          portfolio_url?: string | null;
          sns_url?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ideathon_participant_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      startup_teams: {
        Row: {
          id: string;
          name: string;
          description: string;
          batch: string;
          lead_preneur_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          batch?: string;
          lead_preneur_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          batch?: string;
          lead_preneur_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "startup_teams_lead_preneur_id_fkey";
            columns: ["lead_preneur_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "startup_teams_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      startup_team_members: {
        Row: {
          id: string;
          team_id: string;
          profile_id: string;
          role_in_team: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          profile_id: string;
          role_in_team?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          profile_id?: string;
          role_in_team?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "startup_team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "startup_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "startup_team_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      team_kpis: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          description: string;
          owner_id: string | null;
          period_start: string | null;
          period_end: string | null;
          measurement_type: "numeric" | "reduce" | "checklist";
          start_value: number | null;
          target_value: number;
          current_value: number;
          unit: string;
          is_measured: boolean;
          checklist_items: Array<{ id: string; text: string; done: boolean }>;
          status: TeamKpiStatus;
          progress_note: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          description?: string;
          owner_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          measurement_type?: "numeric" | "reduce" | "checklist";
          start_value?: number | null;
          target_value?: number;
          current_value?: number;
          unit?: string;
          is_measured?: boolean;
          checklist_items?: Array<{ id: string; text: string; done: boolean }>;
          status?: TeamKpiStatus;
          progress_note?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          description?: string;
          owner_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          measurement_type?: "numeric" | "reduce" | "checklist";
          start_value?: number | null;
          target_value?: number;
          current_value?: number;
          unit?: string;
          is_measured?: boolean;
          checklist_items?: Array<{ id: string; text: string; done: boolean }>;
          status?: TeamKpiStatus;
          progress_note?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_kpis_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "startup_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_kpis_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      team_kpi_templates: {
        Row: {
          id: string;
          key: string;
          title: string;
          description: string;
          category: string;
          unit: string;
          default_target_value: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          title: string;
          description?: string;
          category?: string;
          unit?: string;
          default_target_value?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          title?: string;
          description?: string;
          category?: string;
          unit?: string;
          default_target_value?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_review_posts: {
        Row: {
          id: string;
          team_id: string;
          author_id: string | null;
          title: string;
          content: string;
          content_blocks: Array<
            | { type: "text"; text: string; variant?: "paragraph" | "heading1" | "heading2" | "heading3" }
            | { type: "blocknote"; blocks: unknown[]; markdown?: string }
            | { type: "kpi"; kpiId: string }
            | { type: "image"; url: string; width?: number }
            | { type: "file"; name: string; url: string }
          >;
          kpi_ids: string[];
          image_urls: string[];
          file_attachments: Array<{ name: string; url: string }>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          author_id?: string | null;
          title: string;
          content?: string;
          content_blocks?: Array<
            | { type: "text"; text: string; variant?: "paragraph" | "heading1" | "heading2" | "heading3" }
            | { type: "blocknote"; blocks: unknown[]; markdown?: string }
            | { type: "kpi"; kpiId: string }
            | { type: "image"; url: string; width?: number }
            | { type: "file"; name: string; url: string }
          >;
          kpi_ids?: string[];
          image_urls?: string[];
          file_attachments?: Array<{ name: string; url: string }>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          author_id?: string | null;
          title?: string;
          content?: string;
          content_blocks?: Array<
            | { type: "text"; text: string; variant?: "paragraph" | "heading1" | "heading2" | "heading3" }
            | { type: "blocknote"; blocks: unknown[]; markdown?: string }
            | { type: "kpi"; kpiId: string }
            | { type: "image"; url: string; width?: number }
            | { type: "file"; name: string; url: string }
          >;
          kpi_ids?: string[];
          image_urls?: string[];
          file_attachments?: Array<{ name: string; url: string }>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_review_posts_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "startup_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_review_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      office_hours: {
        Row: {
          id: string;
          team_id: string;
          held_at: string;
          next_due_at: string | null;
          summary: string;
          decisions: string;
          next_actions: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          held_at?: string;
          next_due_at?: string | null;
          summary?: string;
          decisions?: string;
          next_actions?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          held_at?: string;
          next_due_at?: string | null;
          summary?: string;
          decisions?: string;
          next_actions?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "office_hours_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "startup_teams";
            referencedColumns: ["id"];
          }
        ];
      };
      office_hour_attendees: {
        Row: {
          id: string;
          office_hour_id: string;
          profile_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          office_hour_id: string;
          profile_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          office_hour_id?: string;
          profile_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "office_hour_attendees_office_hour_id_fkey";
            columns: ["office_hour_id"];
            isOneToOne: false;
            referencedRelation: "office_hours";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "office_hour_attendees_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
          due_date: string | null;
          section_type_config: Json | null;
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
          due_date?: string | null;
          section_type_config?: Json | null;
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
          due_date?: string | null;
          section_type_config?: Json | null;
        };
        Relationships: [];
      };
      homework_team_assignments: {
        Row: {
          homework_id: string;
          user_id: string;
          team_name: string;
          created_at: string;
          task_index: number;
        };
        Insert: {
          homework_id: string;
          user_id: string;
          team_name: string;
          created_at?: string;
          task_index?: number;
        };
        Update: {
          homework_id?: string;
          user_id?: string;
          team_name?: string;
          created_at?: string;
          task_index?: number;
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
      homework_section_submissions: {
        Row: {
          homework_id: string;
          user_id: string;
          section_id: string;
          is_completed: boolean;
          is_override: boolean;
          updated_at: string | null;
        };
        Insert: {
          homework_id: string;
          user_id: string;
          section_id: string;
          is_completed?: boolean;
          is_override?: boolean;
          updated_at?: string | null;
        };
        Update: {
          homework_id?: string;
          user_id?: string;
          section_id?: string;
          is_completed?: boolean;
          is_override?: boolean;
          updated_at?: string | null;
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
      spec_events: {
        Row: {
          id: string;
          title: string;
          description: string;
          batch: string;
          status: string;
          start_date: string;
          end_date: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          batch: string;
          status?: string;
          start_date: string;
          end_date: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          batch?: string;
          status?: string;
          start_date?: string;
          end_date?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spec_logs: {
        Row: {
          id: string;
          event_id: string;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spec_log_images: {
        Row: {
          id: string;
          log_id: string;
          image_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          log_id: string;
          image_url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          log_id?: string;
          image_url?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      spec_log_comments: {
        Row: {
          id: string;
          log_id: string;
          author_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          log_id: string;
          author_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          log_id?: string;
          author_id?: string;
          content?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spec_log_reactions: {
        Row: {
          id: string;
          log_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          log_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          log_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      faq_items: {
        Row: {
          id: string;
          section: string;
          section_title: string;
          question: string;
          answer: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section: string;
          section_title: string;
          question: string;
          answer: string;
          sort_order: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section?: string;
          section_title?: string;
          question?: string;
          answer?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      partners: {
        Row: {
          id: string;
          name: string;
          logo_url: string;
          website_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url: string;
          website_url?: string | null;
          sort_order: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string;
          website_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      curriculum_weeks: {
        Row: {
          id: string;
          track: string;
          week_number: number | null;
          week_label: string;
          topic: string;
          objectives: string | null;
          assignment: string | null;
          notes: string | null;
          batch: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
          start_date: string | null;
          end_date: string | null;
        };
        Insert: {
          id?: string;
          track: string;
          week_number?: number | null;
          week_label: string;
          topic: string;
          objectives?: string | null;
          assignment?: string | null;
          notes?: string | null;
          batch: string;
          sort_order: number;
          created_at?: string;
          updated_at?: string;
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          id?: string;
          track?: string;
          week_number?: number | null;
          week_label?: string;
          topic?: string;
          objectives?: string | null;
          assignment?: string | null;
          notes?: string | null;
          batch?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          start_date?: string | null;
          end_date?: string | null;
        };
        Relationships: [];
      };
      curriculum_areas: {
        Row: {
          id: string;
          track: string;
          area_number: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          activities: Json;
          batch: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          track: string;
          area_number: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          activities: Json;
          batch: string;
          sort_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          track?: string;
          area_number?: string;
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          activities?: Json;
          batch?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_form_fields: {
        Row: {
          id: string;
          batch: string;
          field_name: string;
          label: string;
          description: string | null;
          field_type: string;
          required: boolean;
          min_length: number | null;
          max_length: number | null;
          placeholder: string | null;
          options: Json | null;
          step_number: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch: string;
          field_name: string;
          label: string;
          description?: string | null;
          field_type?: string;
          required?: boolean;
          min_length?: number | null;
          max_length?: number | null;
          placeholder?: string | null;
          options?: Json | null;
          step_number?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          batch?: string;
          field_name?: string;
          label?: string;
          description?: string | null;
          field_type?: string;
          required?: boolean;
          min_length?: number | null;
          max_length?: number | null;
          placeholder?: string | null;
          options?: Json | null;
          step_number?: number;
          sort_order?: number;
          is_active?: boolean;
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
      safe_remove_admin: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
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
