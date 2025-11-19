<!-- Login information, profile picture and 
    current call information go here
-->

<template>
<Toolbar>
                    <template #start>
                        <Button icon="pi pi-plus" class="mr-2" severity="secondary" text />
                        <Button icon="pi pi-print" class="mr-2" severity="secondary" text />
                        <Button icon="pi pi-upload" severity="secondary" text />
                    </template>

                    <template #center>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText placeholder="Search" />
                        </IconField>
                    </template>

                    <template #end>
                        <div class="flex flex-col items-center gap-2" role="navigation" aria-label="Main navigation">
                            <Avatar image="/avatar.png" alt="User avatar" class="w-14 h-14" size="large" />
                            <div class="text-sm text-gray-700">Nome do Colaborador</div>
                        </div>                    
                    </template>
                </Toolbar>
                </template>