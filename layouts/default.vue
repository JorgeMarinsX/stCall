<template>
  <div class="flex h-screen w-full">
    <AppSidebar />
    <div class="flex-1 flex flex-col w-full">
      <header class="flex-shrink-0 pr-4 pl-4 pt-3">
        <TopBar />
      </header>
      <main class="flex flex-row flex-wrap w-full overflow-y-auto p-4">
        <slot />
      </main>
    </div>
  </div>
</template>