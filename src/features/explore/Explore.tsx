import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Button, Input, Chip, Card, EmptyState, Toast } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme/tokens";

export default function Explore() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("schools");
  const [selectedFilters, setSelectedFilters] = useState({
    county: "",
    domain: "",
    level: "",
  });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sections for exploration
  const sections = [
    { id: "schools", label: t("explore.sections.schools"), icon: "school" },
    {
      id: "universities",
      label: t("explore.sections.universities"),
      icon: "university",
    },
    { id: "careers", label: t("explore.sections.careers"), icon: "career" },
    { id: "courses", label: t("explore.sections.courses"), icon: "course" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let query;

        // Build query based on selected section
        switch (selectedSection) {
          case "schools":
            query = supabase.from("schools").select(`
                *,
                school_profiles (
                  *,
                  school_profile_programs (
                    *,
                    programs (*)
                  )
                )
              `);
            break;
          case "universities":
            query = supabase.from("universities").select(`
                *,
                programs (
                  *,
                  program_skills (
                    *,
                    skills (*)
                  ),
                  program_careers (
                    *,
                    careers (*)
                  )
                )
              `);
            break;
          case "careers":
            query = supabase.from("careers").select(`
                *,
                career_skills (
                  *,
                  skills (*)
                ),
                program_careers (
                  *,
                  programs (
                    *,
                    universities (*)
                  )
                )
              `);
            break;
          case "courses":
            query = supabase.from("courses").select(`
                *,
                course_skills (
                  *,
                  skills (*)
                )
              `);
            break;
          default:
            query = supabase.from("schools").select("*");
        }

        // Apply search query if provided
        if (searchQuery.trim()) {
          // For text search, we'll need to use ilike or full-text search
          // For simplicity, we'll filter on the client side after fetching
          // In a production app, you'd use Supabase's full-text search capabilities
        }

        // Apply filters
        if (selectedFilters.county && selectedSection === "schools") {
          query = query.eq("county", selectedFilters.county);
        }

        // Execute query
        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        // Process and format the data for display
        const formattedItems = formatItemsForDisplay(data, selectedSection);
        setItems(formattedItems);
      } catch (err) {
        console.error("Error fetching explore data:", err);
        setError("Failed to load data. Please try again.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSection, searchQuery, selectedFilters, supabase]);

  // Format items for display based on section type
  const formatItemsForDisplay = (rawData: any[], section: string): any[] => {
    return rawData.map((item) => {
      const baseItem = {
        id: item.id,
        type: section as any,
      };

      switch (section) {
        case "schools":
          return {
            ...baseItem,
            name: item.name,
            specialization: item.school_profiles?.[0]?.specialization || "",
            county: item.county || "",
            description: item.description || "",
            sourceUrl: item.source_url || "",
          };
        case "universities":
          return {
            ...baseItem,
            name: item.name,
            degreeLevel: item.programs?.[0]?.degree_level || "",
            duration: `${item.programs?.[0]?.duration_years} ani`,
            description: item.description || "",
            sourceUrl: item.source_url || "",
          };
        case "careers":
          return {
            ...baseItem,
            name: item.name,
            domain: item.domain || "",
            description: item.description || "",
            sourceUrl: item.source_url || "",
          };
        case "courses":
          return {
            ...baseItem,
            title: item.title || "",
            provider: item.provider || "",
            language: item.language || "română",
            isFree: item.is_free ?? false,
            level: item.level || "începător",
            description: item.description || "",
            sourceUrl: item.source_url || "",
          };
        default:
          return baseItem;
      }
    });
  };

  const handleSectionPress = (sectionId: string) => {
    setSelectedSection(sectionId);
    // Reset filters when changing section
    setSelectedFilters({ county: "", domain: "", level: "" });
  };

  const handleSearch = () => {
    // Search is handled by the useEffect hook when searchQuery changes
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    // Search is handled by the useEffect hook
  };

  // Filter items based on search query and filters
  const filteredItems = items.filter((item) => {
    // Text search
    if (searchQuery.trim()) {
      const searchableFields = [
        item.name,
        item.title,
        item.description,
        item.specialization,
        item.provider,
        item.domain,
        item.degreeLevel,
      ].filter(Boolean) as string[];

      const matchesSearch = searchableFields.some((field) =>
        field.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (!matchesSearch) {
        return false;
      }
    }

    // Filter by selected section (already handled by useEffect, but double-checking)
    if (item.type !== selectedSection) {
      return false;
    }

    // Apply additional filters
    if (selectedFilters.county && item.county !== selectedFilters.county) {
      return false;
    }
    if (selectedFilters.domain && item.domain !== selectedFilters.domain) {
      return false;
    }
    if (selectedFilters.level && item.level !== selectedFilters.level) {
      return false;
    }

    return true;
  });

  const renderItem = ({ item }: { item: any }) => {
    return (
      <Card style={styles.card}>
        <View style={styles.itemContent}>
          {item.type === "schools" && (
            <View>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemSubtitle}>{item.specialization}</Text>
              <Chip variant='outline' size='sm'>
                {item.county}
              </Chip>
            </View>
          )}
          {item.type === "universities" && (
            <View>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemSubtitle}>
                {item.degreeLevel} • {item.duration}
              </Text>
            </View>
          )}
          {item.type === "careers" && (
            <View>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Chip variant='outline' size='sm'>
                {item.domain}
              </Chip>
            </View>
          )}
          {item.type === "courses" && (
            <View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.courseDetails}>
                <Text style={styles.detailText}>
                  {item.provider} • {item.language}
                </Text>
                <Chip variant={item.isFree ? "secondary" : "outline"} size='sm'>
                  {item.isFree ? t("common.isFree") : t("common.paid")}
                </Chip>
                <Chip variant='outline' size='sm'>
                  {item.level}
                </Chip>
              </View>
            </View>
          )}
          <View style={styles.itemActions}>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <Button
              variant='outline'
              size='sm'
              onPress={() => {
                // Navigate to detail screen based on item type
                let detailPath = "";
                switch (item.type) {
                  case "schools":
                    detailPath = `/(tabs)/explore/school/${item.id}`;
                    break;
                  case "universities":
                    detailPath = `/(tabs)/explore/university/${item.id}`;
                    break;
                  case "careers":
                    detailPath = `/(tabs)/explore/career/${item.id}`;
                    break;
                  case "courses":
                    detailPath = `/(tabs)/explore/course/${item.id}`;
                    break;
                }
                router.push(detailPath as any);
              }}
            >
              {t("detail.source")}
            </Button>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("explore.title")}</Text>
        <View style={styles.searchBar}>
          <Input
            label={t("explore.search")}
            placeholder={t("explore.search")}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Button variant='outline' size='md' onPress={handleSearch}>
            {t("common.search")}
          </Button>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            variant='outline'
            size='md'
            onPress={() => {
              // Retry fetching data
              setLoading(true);
              // Trigger a refetch by updating selectedSection temporarily
              setSelectedSelectedSection(selectedSection);
            }}
          >
            {t("common.retry")}
          </Button>
        </View>
      )}

      <View style={styles.tabs}>
        {sections.map((section) => (
          <Pressable
            key={section.id}
            style={[
              styles.tabButton,
              selectedSection === section.id && styles.tabButtonActive,
            ]}
            onPress={() => handleSectionPress(section.id)}
          >
            <Text style={styles.tabText}>{section.label}</Text>
          </Pressable>
        ))}
      </View>

      {selectedSection !== "courses" && (
        <View style={styles.filters}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>
              {t("explore.filters.county")}
            </Text>
            <Input
              label={t("explore.filters.county")}
              placeholder={t("explore.filters.county")}
              value={selectedFilters.county}
              onChangeText={(value) => handleFilterChange("county", value)}
            />
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>
              {t("explore.filters.domain")}
            </Text>
            <Input
              label={t("explore.filters.domain")}
              placeholder={t("explore.filters.domain")}
              value={selectedFilters.domain}
              onChangeText={(value) => handleFilterChange("domain", value)}
            />
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>{t("explore.filters.level")}</Text>
            <Input
              label={t("explore.filters.level")}
              placeholder={t("explore.filters.level")}
              value={selectedFilters.level}
              onChangeText={(value) => handleFilterChange("level", value)}
            />
          </View>
        </View>
      )}

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loading}>
            {/* Loading spinner would go here */}
            <Text style={styles.loadingText}>{t("common.loading")}</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t("explore.noResults")}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContentContainer}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: 600 as const,
  },
  searchBar: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.border,
    paddingBottom: spacing.xs,
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.xs,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderColor: theme.primary,
  },
  tabText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    padding: spacing.lg,
    marginVertical: spacing.md,
    alignItems: "center",
  },
  errorText: {
    color: theme.danger,
    fontSize: 16,
    textAlign: "center",
  },
  filters: {
    padding: spacing.lg,
  },
  filterGroup: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  listContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.textPrimary,
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyStateText: {
    color: theme.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  listContentContainer: {
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: theme.surface,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  itemContent: {
    padding: spacing.md,
  },
  itemTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: 600 as const,
    marginBottom: spacing.xs,
  },
  itemSubtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  itemDescription: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  courseDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  detailText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  itemActions: {
    marginTop: spacing.md,
  },
});

// Helper function to trigger refetch when needed
const setSelectedSelectedSection = (section: string) => {
  // This is a workaround to trigger a refetch
  // In a real implementation, you might use query keys or other React Query patterns
};
