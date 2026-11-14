import { List, Scroll, Text, View, mount, resource, signal, token } from "nsh";
import { fetchPost, fetchPosts, type PostListItem } from "./lib/api";
import {
  CATEGORIES,
  categoryColor,
  categoryLabel,
  decodeEntities,
  excerpt,
  formatTime,
  stripHtml,
} from "./lib/format";

const activeCategory = signal("");
const selectedPost = signal<PostListItem | null>(null);

const posts = resource(activeCategory, async (category, { signal }) => {
  const result = await fetchPosts({ category, signal });
  return result.posts;
});

const detail = resource(selectedPost, async (post, { signal }) => {
  if (!post) return null;
  return fetchPost(post.id, signal);
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
  const post = props.post;
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
            backgroundColor: categoryColor(post.category),
          }}
        />
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>
          {categoryLabel(post.category)}
        </Text>
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>
          · {formatTime(post.published_at || post.created_at)}
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
        {post.title}
      </Text>

      <Text
        style={{
          numberOfLines: 2,
          fontSize: 14,
          color: token("muted-foreground"),
          lineHeight: 20,
        }}
      >
        {excerpt(stripHtml(decodeEntities(post.summary)))}
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
          {post.user_name || "匿名"}
          {post.user_guild_name ? ` · ${post.user_guild_name}` : ""}
        </Text>
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>赞 {post.likes}</Text>
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>评 {post.comment_count}</Text>
        <Text style={{ fontSize: 12, color: token("muted-foreground") }}>阅 {post.views}</Text>
      </View>
    </View>
  );
}

function DetailPage(props: { post: PostListItem; onBack: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: token("background") }}>
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
          <Text
            style={{
              fontSize: 23,
              fontWeight: "700",
              color: token("foreground"),
              lineHeight: 31,
            }}
          >
            {props.post.title}
          </Text>
          <Text style={{ fontSize: 13, color: token("muted-foreground") }}>
            {props.post.user_name || "匿名"} ·{" "}
            {formatTime(props.post.published_at || props.post.created_at)} ·{" "}
            {categoryLabel(props.post.category)}
          </Text>

          <If when={detail.loading()}>
            <Text style={{ fontSize: 14, color: token("muted-foreground") }}>正在加载正文…</Text>
          </If>
          <If when={detail.error()}>
            <Text style={{ fontSize: 14, color: token("destructive") }}>
              正文加载失败：{String(detail.error())}
            </Text>
          </If>
          <If when={detail()}>
            {(post) => (
              <Text style={{ fontSize: 15, lineHeight: 25, color: token("foreground") }}>
                {stripHtml(post().content)}
              </Text>
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
      <If when={selectedPost()}>
        <DetailPage post={selectedPost()!} onBack={() => selectedPost.set(null)} />
      </If>

      <If when={!selectedPost()}>
        <View style={{ flex: 1 }}>
          <View style={{ paddingTop: 54, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: token("foreground") }}>
              妖精论坛
            </Text>
            <Text style={{ fontSize: 13, color: token("muted-foreground"), marginTop: 2 }}>
              最新帖子 · NSH 客户端
            </Text>
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
                  active={activeCategory() === item().key}
                  onPress={() => activeCategory.set(item().key)}
                />
              )}
            </Each>
          </View>

          <List
            style={{ flex: 1 }}
            each={posts() ?? []}
            refreshing={posts.state() === "refreshing"}
            onRefresh={() => posts.refetch()}
            contentClass="gap-3 px-4 pb-10"
            empty={
              <View style={{ padding: 28, alignItems: "center", gap: 8 }}>
                <If when={posts.loading()}>
                  <Text style={{ fontSize: 14, color: token("muted-foreground") }}>
                    加载中…
                  </Text>
                </If>
                <If when={posts.error()}>
                  <Text
                    style={{ fontSize: 14, color: token("destructive"), textAlign: "center" }}
                  >
                    加载失败：{String(posts.error())}
                  </Text>
                  <Text style={{ fontSize: 13, color: token("muted-foreground") }}>
                    下拉刷新重试
                  </Text>
                </If>
                <If when={!posts.loading() && !posts.error()}>
                  <Text style={{ fontSize: 14, color: token("muted-foreground") }}>
                    这里还没有帖子
                  </Text>
                </If>
              </View>
            }
          >
            {(item) => <PostCard post={item()} onPress={() => selectedPost.set(item())} />}
          </List>
        </View>
      </If>
    </View>
  );
}

mount(App);
