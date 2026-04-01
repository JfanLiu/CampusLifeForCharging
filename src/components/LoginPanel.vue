<script setup lang="ts">
defineProps<{
  username: string;
  password: string;
  busy: boolean;
}>();

const emit = defineEmits<{
  'update:username': [value: string];
  'update:password': [value: string];
  submit: [];
}>();

function updateUsername(event: Event) {
  emit('update:username', (event.target as HTMLInputElement).value);
}

function updatePassword(event: Event) {
  emit('update:password', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <section id="login-view" class="panel auth-panel">
    <div class="login-layout">
      <div>
        <div class="panel-head">
          <div>
            <p class="panel-kicker">登录</p>
            <h2>登录校园账户</h2>
          </div>
        </div>
        <p class="panel-note">
          使用你平时在校园充电系统里使用的账号密码登录。网页只保留当前会话需要的信息，关闭或退出后可重新登录。
        </p>
        <form class="form-stack" @submit.prevent="emit('submit')">
          <label class="field">
            <span>账号</span>
            <input
              :value="username"
              name="username"
              type="text"
              autocomplete="username"
              placeholder="请输入手机号"
              required
              @input="updateUsername"
            />
          </label>
          <label class="field">
            <span>密码</span>
            <input
              :value="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="登录密码"
              required
              @input="updatePassword"
            />
          </label>
          <button class="button button-primary" type="submit" :disabled="busy">
            {{ busy ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>

      <aside class="auth-side">
        <article class="mini-card">
          <h3>更适合手机使用</h3>
          <p>
            输入框、按钮和卡片都按手机触控场景做了放大，站着用、路上看、到桩旁边操作都会更顺手。
          </p>
        </article>
        <article class="mini-card">
          <h3>适合日常打开的场景</h3>
          <ul class="feature-list">
            <li>出门前先看哪些地点还有空闲桩</li>
            <li>到现场后扫码或输入编号直接充电</li>
            <li>随手查余额、当前状态和本月记录</li>
          </ul>
        </article>
      </aside>
    </div>
  </section>
</template>
