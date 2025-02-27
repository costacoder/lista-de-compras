<template>
  <v-container>
    <!-- Título -->
    <v-row class="mb-4">
      <v-col>
        <v-card>
          <v-card-title class="headline">
            Lista de Compras
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Lista de Itens -->
    <v-row>
      <v-col>
        <v-card>
          <v-list>
            <v-list-item v-for="(item, id) in items" :key="id">
              <v-row align="center" no-gutters>
                <!-- Nome do Item -->
                <v-col>
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                </v-col>

                <!-- Botões de Editar e Excluir -->
                <v-col cols="auto" class="d-flex" style="gap: 8px;">
                  <v-btn density="compact" icon @click="editItem(id, item.name)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>

                  <v-btn density="compact" icon color="red" @click="removeItem(id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Formulário para Adicionar Itens -->
    <v-dialog v-model="showInput" max-width="500">
      <v-card>
        <v-card-title>Adicionar Novo Item</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newItem"
            label="Novo item"
            outlined
            dense
            @keyup.enter="addItem"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="showInput = false" color="grey">Cancelar</v-btn>
          <v-btn @click="addItem" color="primary">Adicionar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Formulário para Editar Itens -->
    <v-dialog v-model="showEdit" max-width="500">
      <v-card>
        <v-card-title>Editar Item</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editedItem.name"
            label="Editar item"
            outlined
            dense
            @keyup.enter="updateItem"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="showEdit = false" color="grey">Cancelar</v-btn>
          <v-btn @click="updateItem" color="primary">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Botão Flutuante (FAB) -->
    <v-btn
      fab
      dark
      color="primary"
      @click="showInput = true"
      style="
      position: fixed; 
      bottom: 20px; 
      left: 50%; 
      transform: translateX(-50%); 
      z-index: 1000;
      opacity: 0.7;
      "
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <!-- Feedback Visual (snackbar) -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="1500"
      location="top"      
    >
      {{ snackbar.message }}
    </v-snackbar>

  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';
import { database, ref as dbRef, push, onValue, remove, update } from '../firebase';

export default {
  setup() {
    const items = ref({});
    const newItem = ref('');
    const showInput = ref(false);
    const showEdit = ref(false);
    const editedItem = ref({ id: null, name: '' });
    const snackbar = ref({
      show: false,
      message: '',
      color: 'success',
    });

    const shoppingListRef = dbRef(database, 'shoppingList');

    // Solicitar permissão para notificações ao iniciar
    const requestNotificationPermission = () => {
      if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            console.log("Permissão concedida para notificações.");
          } else {
            console.log("Permissão negada.");
          }
        });
      }
    };

    // Exibir notificação persistente
    const showPersistentNotification = (title, body) => {
      if ("Notification" in window && Notification.permission === "granted") {
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
              body: body,
              icon: "/logo.png",
              badge: "/badge.png",
              requireInteraction: true, // Mantém a notificação visível
            });
          });
        } else {
          new Notification(title, { body: body, requireInteraction: true });
        }
      }
    };

    // Ouvir mudanças no Firebase e mostrar notificações
    onMounted(() => {
      requestNotificationPermission();

      onValue(shoppingListRef, (snapshot) => {
        const data = snapshot.val() || {};
        const previousItems = { ...items.value };
        items.value = data;

        // Detectar novo item adicionado
        const newItemKey = Object.keys(data).find(key => !(key in previousItems));
        if (newItemKey) {
          showPersistentNotification("Novo item adicionado", data[newItemKey].name);
        }
      });
    });

    // Adicionar item
    const addItem = () => {
      if (newItem.value.trim()) {
        const itemName = newItem.value;
        push(shoppingListRef, { name: itemName });
        newItem.value = '';
        showInput.value = false;
        showSnackbar(`"${itemName}" adicionado!`, "success");
        showPersistentNotification("Item Adicionado", itemName);
      } else {
        showSnackbar("Digite um item válido.", "error");
      }
    };

    // Remover item
    const removeItem = (id) => {
      remove(dbRef(database, `shoppingList/${id}`));
      showSnackbar("Item removido!", "success");
    };

    // Abrir diálogo de edição
    const editItem = (id, name) => {
      editedItem.value = { id, name };
      showEdit.value = true;
    };

    // Atualizar item
    const updateItem = () => {
      if (editedItem.value.name.trim()) {
        update(dbRef(database, `shoppingList/${editedItem.value.id}`), { name: editedItem.value.name });
        showEdit.value = false;
        showSnackbar("Item atualizado!", "success");
      } else {
        showSnackbar("Digite um nome válido.", "error");
      }
    };

    // Exibir mensagem no snackbar
    const showSnackbar = (message, color = "success") => {
      snackbar.value = { show: true, message, color };
    };

    return {
      items,
      newItem,
      addItem,
      removeItem,
      snackbar,
      showInput,
      showEdit,
      editedItem,
      editItem,
      updateItem,
    };
  }
};
</script>

<style scoped>
.v-list-item {
  border-bottom: 1px solid #eee;
}
</style>
