export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PublicEnums = {
  app_role: "student" | "teacher" | "admin";
  discount_type: "percentage" | "fixed";
  order_status: "pending" | "completed" | "rejected";
  student_gender: "male" | "female";
  student_grade: "first_secondary" | "second_secondary" | "third_secondary";
  student_section:
    | "general"
    | "scientific"
    | "literary"
    | "science"
    | "mathematics"
    | "preparatory"
    | "medicine_life_sciences"
    | "engineering_computer_science"
    | "business"
    | "arts";
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: PublicEnums["app_role"];
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: PublicEnums["app_role"];
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: PublicEnums["app_role"];
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          profile_id: string;
          student_phone: string;
          father_phone: string;
          school_name: string;
          gender: PublicEnums["student_gender"];
          grade: PublicEnums["student_grade"];
          section: PublicEnums["student_section"];
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          student_phone: string;
          father_phone: string;
          school_name: string;
          gender: PublicEnums["student_gender"];
          grade: PublicEnums["student_grade"];
          section: PublicEnums["student_section"];
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          student_phone?: string;
          father_phone?: string;
          school_name?: string;
          gender?: PublicEnums["student_gender"];
          grade?: PublicEnums["student_grade"];
          section?: PublicEnums["student_section"];
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      teachers: {
        Row: {
          id: string;
          profile_id: string;
          slug: string;
          bio: string | null;
          subject: string;
          avatar_url: string | null;
          cover_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          slug?: string;
          bio?: string | null;
          subject: string;
          avatar_url?: string | null;
          cover_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          slug?: string;
          bio?: string | null;
          subject?: string;
          avatar_url?: string | null;
          cover_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          id: string;
          teacher_id: string;
          subject: string | null;
          title: string;
          description: string | null;
          price: number;
          target_grade: PublicEnums["student_grade"] | null;
          target_section: PublicEnums["student_section"] | null;
          thumbnail_url: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          subject?: string | null;
          title: string;
          description?: string | null;
          price?: number;
          target_grade?: PublicEnums["student_grade"] | null;
          target_section?: PublicEnums["student_section"] | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          subject?: string | null;
          title?: string;
          description?: string | null;
          price?: number;
          target_grade?: PublicEnums["student_grade"] | null;
          target_section?: PublicEnums["student_section"] | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          recipient_profile_id: string;
          actor_profile_id: string | null;
          title: string;
          body: string;
          href: string | null;
          kind: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_profile_id: string;
          actor_profile_id?: string | null;
          title: string;
          body: string;
          href?: string | null;
          kind?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_profile_id?: string;
          actor_profile_id?: string | null;
          title?: string;
          body?: string;
          href?: string | null;
          kind?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey";
            columns: ["recipient_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          order_index: number;
          vdocipher_video_id: string | null;
          bunny_video_id: string | null;
          thumbnail_url: string | null;
          video_provider: string;
          duration: number | null;
          is_free_preview: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          order_index: number;
          vdocipher_video_id?: string | null;
          bunny_video_id?: string | null;
          thumbnail_url?: string | null;
          video_provider?: string;
          duration?: number | null;
          is_free_preview?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          order_index?: number;
          vdocipher_video_id?: string | null;
          bunny_video_id?: string | null;
          thumbnail_url?: string | null;
          video_provider?: string;
          duration?: number | null;
          is_free_preview?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          lesson_id: string;
          status: "in_progress" | "completed";
          watched_seconds: number;
          started_at: string;
          last_watched_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          lesson_id: string;
          status?: "in_progress" | "completed";
          watched_seconds?: number;
          started_at?: string;
          last_watched_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          lesson_id?: string;
          status?: "in_progress" | "completed";
          watched_seconds?: number;
          started_at?: string;
          last_watched_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_attachments: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          file_url: string;
          file_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          file_url: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          file_url?: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_attachments_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_quiz_questions: {
        Row: {
          id: string;
          lesson_id: string;
          question: string;
          options: Json;
          correct_option_index: number;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          question: string;
          options: Json;
          correct_option_index: number;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          question?: string;
          options?: Json;
          correct_option_index?: number;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_quiz_questions_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          student_id: string;
          total_amount: number;
          status: PublicEnums["order_status"];
          fawry_ref_no: string | null;
          rejection_reason: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          total_amount: number;
          status?: PublicEnums["order_status"];
          fawry_ref_no?: string | null;
          rejection_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          total_amount?: number;
          status?: PublicEnums["order_status"];
          fawry_ref_no?: string | null;
          rejection_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          course_id: string;
          price_at_purchase: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          course_id: string;
          price_at_purchase: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          course_id?: string;
          price_at_purchase?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          order_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          order_id: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          order_id?: string;
          enrolled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          id: string;
          teacher_id: string;
          course_id: string | null;
          code: string;
          discount_type: PublicEnums["discount_type"];
          discount_value: number;
          usage_limit: number | null;
          used_count: number;
          target_student_id: string | null;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          course_id?: string | null;
          code: string;
          discount_type: PublicEnums["discount_type"];
          discount_value: number;
          usage_limit?: number | null;
          used_count?: number;
          target_student_id?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          course_id?: string | null;
          code?: string;
          discount_type?: PublicEnums["discount_type"];
          discount_value?: number;
          usage_limit?: number | null;
          used_count?: number;
          target_student_id?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupons_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupons_target_student_id_fkey";
            columns: ["target_student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_student_targets: {
        Row: {
          coupon_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          coupon_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: {
          coupon_id?: string;
          student_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupon_student_targets_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_student_targets_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_redemptions: {
        Row: {
          id: string;
          coupon_id: string;
          student_id: string;
          order_id: string | null;
          discount_amount: number;
          redeemed_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          student_id: string;
          order_id?: string | null;
          discount_amount?: number;
          redeemed_at?: string;
        };
        Update: {
          id?: string;
          coupon_id?: string;
          student_id?: string;
          order_id?: string | null;
          discount_amount?: number;
          redeemed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_redemptions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      activation_codes: {
        Row: {
          id: string;
          course_id: string;
          code: string;
          expires_at: string;
          used_at: string | null;
          used_by_student_id: string | null;
          order_id: string | null;
          created_by_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          code: string;
          expires_at: string;
          used_at?: string | null;
          used_by_student_id?: string | null;
          order_id?: string | null;
          created_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          code?: string;
          expires_at?: string;
          used_at?: string | null;
          used_by_student_id?: string | null;
          order_id?: string | null;
          created_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activation_codes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activation_codes_used_by_student_id_fkey";
            columns: ["used_by_student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activation_codes_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activation_codes_created_by_profile_id_fkey";
            columns: ["created_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      teacher_earnings: {
        Row: {
          id: string;
          teacher_id: string;
          order_id: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          order_id: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          order_id?: string;
          amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_earnings_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teacher_earnings_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      student_blocks: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string | null;
          blocked_by: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id?: string | null;
          blocked_by?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string | null;
          blocked_by?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_blocks_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_blocks_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_blocks_blocked_by_fkey";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      hero_announcements: {
        Row: {
          id: string;
          created_by: string;
          teacher_id: string | null;
          owner_role: PublicEnums["app_role"];
          title: string;
          image_url: string;
          button_text: string;
          button_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          teacher_id?: string | null;
          owner_role: PublicEnums["app_role"];
          title: string;
          image_url: string;
          button_text: string;
          button_url: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          teacher_id?: string | null;
          owner_role?: PublicEnums["app_role"];
          title?: string;
          image_url?: string;
          button_text?: string;
          button_url?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hero_announcements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hero_announcements_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
        ];
      };
      email_verification_codes: {
        Row: {
          id: string;
          email: string;
          purpose: "student_signup";
          code_hash: string;
          attempts: number;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          purpose: "student_signup";
          code_hash: string;
          attempts?: number;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          purpose?: "student_signup";
          code_hash?: string;
          attempts?: number;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_order_side_effects: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      current_student_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      current_teacher_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: PublicEnums["app_role"] | null;
      };
      generate_teacher_slug: {
        Args: {
          source_name: string;
          teacher_uuid?: string | null;
        };
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_enrolled_in_course: {
        Args: {
          course_uuid: string;
        };
        Returns: boolean;
      };
      owns_course: {
        Args: {
          course_uuid: string;
        };
        Returns: boolean;
      };
      redeem_course_activation_code: {
        Args: {
          course_uuid: string;
          submitted_code: string;
          student_uuid: string;
        };
        Returns: {
          status: string;
          message: string;
          enrollment_id: string | null;
          order_id: string | null;
        }[];
      };
      set_order_completed_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      set_teacher_slug: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: PublicEnums;
    CompositeTypes: Record<string, never>;
  };
};
