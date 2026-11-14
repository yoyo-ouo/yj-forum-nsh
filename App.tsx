import { Scroll, Text, View, computed, mount, resource, token } from "nsh";
import { Head } from "nsh/web";
import { fetchPost, fetchPosts, type PostListItem } from "./lib/api";
import {
  CATEGORIES,
  categoryColor,
  categoryLabel,
  excerpt,
  formatTime,
  stripHtml,
} from "./lib/format";
import { backToHome, errorText, navigate, route, routePath } from "./lib/router";

const posts = resource(async ({ signal }) => {
  // 一次拉取首屏（后端按发布时间倒序），分类在本地过滤：
  // 历史数据同时存在英文 key（talk）与中文标签（闲聊），多值请求顺序会打乱列表。
  const result = await fetchPosts({ signal });
  return result.posts;
});

const category = computed(() => {
  const current = route();
  return current.name === "home" ? current.category : "";
});

const categoryValues = computed(() => {
  const option = CATEGORIES.find((item) => item.key === category());
  return option?.values ?? [];
});

const visiblePosts = computed(() => {
  const all = posts() ?? [];
  const values = categoryValues();
  if (values.length === 0) return all;
  return all.filter((post) => values.includes(post.category));
});

const postId = computed(() => {
  const current = route();
  return current.name === "post" ? current.id : null;
});

const detail = resource(postId, async (id, { signal }) => {
  if (!id) return null;
  return fetchPost(id, signal);
});

function Chip(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <View
      onPress={props.onPress}
      role="button"
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: props.active ? token("primary") : token("card"),
        borderWidth: props.active ? 0 : 1,
        borderColor: token("border"),
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: props.active ? "600" : "500",
          color: props.active ? token("primary-foreground") : token("muted-foreground"),
        }}
      >
        {props.label}
      </Text>
    </View>
  );
}

function PostCard(props: { post: PostListItem; onPress: () => void }) {
  return (
    <View
      onPress={props.onPress}
      role="button"
      style={{
        backgroundColor: token("card"),
        borderRadius: token("radius") + 4,
        borderWidth: 1,
        borderColor: token("border"),
        padding: 14,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: categoryColor(props.post.category),
          }}
        />
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>
          {categoryLabel(props.post.category)}
        </Text>
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>
          · {formatTime(props.post.published_at || props.post.created_at)}
        </Text>
      </View>

      <Text
        style={{
          numberOfLines: 2,
          fontSize: 17,
          fontWeight: "600",
          color: token("foreground"),
          lineHeight: 23,
        }}
      >
        {props.post.title}
      </Text>

      <Text
        style={{
          numberOfLines: 2,
          fontSize: 14,
          color: token("muted-foreground"),
          lineHeight: 20,
        }}
      >
        {excerpt(stripHtml(props.post.summary))}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 }}>
        <Text
          style={{
            numberOfLines: 1,
            flex: 1,
            fontSize: 12,
            color: token("muted-foreground"),
          }}
        >
          {props.post.user_name || "匿名"}
          {props.post.user_guild_name ? ` · ${props.post.user_guild_name}` : ""}
        </Text>
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>赞 {props.post.likes}</Text>
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>
          评 {props.post.comment_count}
        </Text>
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>阅 {props.post.views}</Text>
      </View>
    </View>
  );
}

function DetailPage(props: { onBack: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: token("background") }}>
      <Head
        title={
          detail()?.id === postId()
            ? detail()?.title ?? "帖子详情 · 妖精论坛"
            : "帖子详情 · 妖精论坛"
        }
        canonical={postId() ? routePath({ name: "post", id: postId() ?? "" }) : undefined}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingTop: 54,
          paddingHorizontal: 16,
          paddingBottom: 10,
        }}
      >
        <View
          onPress={props.onBack}
          role="button"
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: token("card"),
            borderWidth: 1,
            borderColor: token("border"),
          }}
        >
          <Text style={{ fontSize: 13, color: token("foreground") }}>← 返回</Text>
        </View>
        <Text
          style={{
            numberOfLines: 1,
            flex: 1,
            fontSize: 13,
            color: token("muted-foreground"),
          }}
        >
          帖子详情
        </Text>
      </View>

      <Scroll style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}>
          <If when={detail.loading()}>
            <Text style={{ fontSize: 14, color: token("muted-foreground") }}>正在加载正文…</Text>
          </If>
          <If when={detail.error()}>
            <Text style={{ fontSize: 14, color: token("destructive") }}>
              帖子加载失败：{errorText(detail.error())}
            </Text>
          </If>
          <If when={detail()?.id === postId() ? detail() : null}>
            {(post) => (
              <View style={{ gap: 12 }}>
                <Text
                  style={{
                    fontSize: 23,
                    fontWeight: "700",
                    color: token("foreground"),
                    lineHeight: 31,
                  }}
                >
                  {post().title}
                </Text>
                <Text style={{ fontSize: 13, color: token("muted-foreground") }}>
                  {post().user_name || "匿名"} ·{" "}
                  {formatTime(post().published_at || post().created_at)} ·{" "}
                  {categoryLabel(post().category)}
                </Text>
                <Text style={{ fontSize: 15, lineHeight: 25, color: token("foreground") }}>
                  {stripHtml(post().content)}
                </Text>
              </View>
            )}
          </If>
        </View>
      </Scroll>
    </View>
  );
}

function App() {
  return (
    <View style={{ flex: 1, backgroundColor: token("background") }}>
      <If when={route().name === "post"}>
        <DetailPage onBack={() => navigate(backToHome(), true)} />
      </If>

      <If when={route().name === "home"}>
        <View style={{ flex: 1 }}>
          <Head
            title={category() ? `${categoryLabel(category())} · 妖精论坛` : "妖精论坛"}
            description="妖精论坛最新帖子"
            canonical={category() ? `/?category=${category()}` : "/"}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              paddingTop: 54,
              paddingHorizontal: 16,
            }}
          >
            <View>
              <Text style={{ fontSize: 26, fontWeight: "700", color: token("foreground") }}>
                妖精论坛
              </Text>
              <Text style={{ fontSize: 13, color: token("muted-foreground"), marginTop: 2 }}>
                最新帖子 · NSH 客户端
              </Text>
            </View>
            <View
              onPress={() => posts.refetch()}
              role="button"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: token("card"),
                borderWidth: 1,
                borderColor: token("border"),
              }}
            >
              <Text style={{ fontSize: 13, color: token("foreground") }}>刷新</Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 10,
            }}
          >
            <Each of={CATEGORIES}>
              {(item) => (
                <Chip
                  label={item().label}
                  active={category() === item().key}
                  onPress={() => navigate({ name: "home", category: item().key }, true)}
                />
              )}
            </Each>
          </View>

          <If when={posts.error() && (posts()?.length ?? 0) > 0}>
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 8,
                padding: 10,
                borderRadius: token("radius"),
                backgroundColor: token("card"),
                borderWidth: 1,
                borderColor: token("border"),
              }}
            >
              <Text style={{ fontSize: 13, color: token("destructive") }}>
                刷新失败：{errorText(posts.error())}
              </Text>
              <View
                onPress={() => posts.refetch()}
                role="button"
                style={{ marginTop: 6, alignSelf: "flex-start" }}
              >
                <Text style={{ fontSize: 13, color: token("primary") }}>点击重试</Text>
              </View>
            </View>
          </If>

          <Scroll style={{ flex: 1 }}>
            <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 }}>
              <If when={posts.loading()}>
                <Text
                  style={{
                    fontSize: 14,
                    color: token("muted-foreground"),
                    textAlign: "center",
                    paddingVertical: 12,
                  }}
                >
                  加载中…
                </Text>
              </If>
              <If when={posts.error()}>
                <Text
                  style={{ fontSize: 14, color: token("destructive"), textAlign: "center" }}
                >
                  加载失败：{errorText(posts.error())}
                </Text>
              </If>
              <If
                when={
                  !posts.loading() && !posts.error() && visiblePosts().length === 0
                }
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: token("muted-foreground"),
                    textAlign: "center",
                    paddingVertical: 24,
                  }}
                >
                  {category() ? "这个分类还没有帖子" : "这里还没有帖子"}
                </Text>
              </If>

              <Each of={visiblePosts()}>
                {(item) => (
                  <PostCard
                    post={item()}
                    onPress={() => navigate({ name: "post", id: item().id })}
                  />
                )}
              </Each>
            </View>
          </Scroll>
        </View>
      </If>
    </View>
  );
}

mount(App);
