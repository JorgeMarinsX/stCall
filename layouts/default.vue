<template>
  <div class="flex h-screen">
    <AppSidebar />
    <div class="flex-1 flex flex-col">
      <header class="pr-4 pl-4 pt-3">
        <TopBar />
      </header>
      <main class="flex-1 overflow-auto p-4">
        <slot />
      </main>
    </div>
  </div>
</template>