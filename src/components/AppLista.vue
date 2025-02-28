<template>
  <v-container>
    <!-- Título -->
    <v-row class="mb-4">
      <v-col>
        <v-card style="background-color: #f0f0f0;">
          <v-row align="center" no-gutters>
            <!-- Coluna para a imagem -->
            <v-col cols="auto" class="ml-3">
              <img src="@/assets/logo.ico" alt="Logo" style="width: 50px; height: 50px;">
            </v-col>
            <!-- Coluna para o título -->
            <v-col>
              <v-card-title class="headline text-uppercase">
                Lista de Compras
              </v-card-title>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Lista de Itens Agrupados por Categoria -->
    <v-row>
      <v-col>
        <v-card
          v-for="(group, category) in groupedItems"
          :key="category"
          class="mb-4"
          :style="{ backgroundColor: categoryColors[category] }"
        >
          <v-card-title class="headline">{{ category }}</v-card-title>
          <v-list>
            <v-list-item v-for="item in group" :key="item.id">
              <v-row align="center" no-gutters>
                <!-- Ícone da Categoria -->
                <v-col cols="auto" class="mr-2">
                  <v-icon>{{ getCategoryIcon(item.category) }}</v-icon>
                </v-col>
                <!-- Nome do Item -->
                <v-col>
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                </v-col>
                <!-- Botões de Editar e Excluir -->
                <v-col cols="auto" class="d-flex" style="gap: 8px;">
                  <v-btn variant="text" density="compact" icon @click="editItem(item.id, item.name, item.category)">
                    <v-icon>mdi-pencil-outline</v-icon>
                  </v-btn>
                  <v-btn variant="text" density="compact" icon color="red" @click="removeItem(item.id)">
                    <v-icon>mdi-window-close</v-icon>
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
          <v-select
            v-model="newItemCategory"
            :items="categories"
            label="Categoria"
            outlined
            dense
          ></v-select>
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
          <v-select
            v-model="editedItem.category"
            :items="categories"
            label="Categoria"
            outlined
            dense
          ></v-select>
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
import { ref, computed, onMounted } from 'vue';
import { database, ref as dbRef, push, onValue, remove, update } from '../firebase';

export default {
  setup() {
    const items = ref({});
    const newItem = ref('');
    const newItemCategory = ref('Comida'); // Categoria padrão
    const showInput = ref(false);
    const showEdit = ref(false);
    const editedItem = ref({ id: null, name: '', category: '' });
    const snackbar = ref({
      show: false,
      message: '',
      color: 'success',
    });

    const categories = ["Bebida", "Comida", "Higiene Pessoal", "Produto de Limpeza", "Diversos"];
    const shoppingListRef = dbRef(database, 'shoppingList');

    // Cores para cada categoria
    const categoryColors = {
      "Bebida": "#FFCCBC", // Laranja claro
      "Comida": "#C8E6C9", // Verde claro
      "Higiene Pessoal": "#B3E5FC", // Azul claro
      "Produto de Limpeza": "#FFF9C4", // Amarelo claro
      "Diversos": "#E1BEE7", // Roxo claro
    };

    // Agrupar itens por categoria
    const groupedItems = computed(() => {
      const grouped = {};
      for (const [id, item] of Object.entries(items.value)) {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push({ id, ...item });
      }
      return grouped;
    });

    // Obter ícone da categoria
    const getCategoryIcon = (category) => {
      switch (category) {
        case "Bebida":
          return "mdi-beer-outline";
        case "Comida":
          return "mdi-silverware-fork-knife";
        case "Higiene Pessoal":
          return "mdi-toothbrush-paste";
        case "Produto de Limpeza":
          return "mdi-spray-bottle";
        case "Diversos":
          return "mdi-dots-horizontal";
        default:
          return "mdi-help";
      }
    };

    // Carregar itens do Firebase
    onMounted(() => {
      onValue(shoppingListRef, (snapshot) => {
        items.value = snapshot.val() || {};
      });
    });

    // Adicionar item
    const addItem = () => {
      if (newItem.value.trim()) {
        const itemName = newItem.value;
        push(shoppingListRef, { 
          name: itemName, 
          category: newItemCategory.value 
        });
        newItem.value = '';
        newItemCategory.value = categories[0]; // Resetar para a categoria padrão
        showInput.value = false;
        showSnackbar(`"${itemName}" adicionado!`, "success");
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
    const editItem = (id, name, category) => {
      editedItem.value = { id, name, category };
      showEdit.value = true;
    };

    // Atualizar item
    const updateItem = () => {
      if (editedItem.value.name.trim()) {
        update(dbRef(database, `shoppingList/${editedItem.value.id}`), { 
          name: editedItem.value.name, 
          category: editedItem.value.category 
        });
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
      newItemCategory,
      showInput,
      showEdit,
      editedItem,
      snackbar,
      categories,
      groupedItems,
      categoryColors,
      getCategoryIcon,
      addItem,
      removeItem,
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
