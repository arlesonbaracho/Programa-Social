<template>
  <form class="panel space-y-6 p-6" @submit.prevent="handleSubmit">
    <div class="grid gap-4 md:grid-cols-2">
      <label class="space-y-2 text-sm">
        <span class="font-medium text-ink/75">Nome do programa</span>
        <input v-model="form.nome" class="field-input" required />
      </label>
      <label class="space-y-2 text-sm">
        <span class="font-medium text-ink/75">Tipo</span>
        <select v-model="form.tipo" class="field-input" required>
          <option value="assistencia">Assistencia</option>
          <option value="saude">Saude</option>
          <option value="educacao">Educacao</option>
          <option value="cultura">Cultura</option>
          <option value="outro">Outro</option>
        </select>
      </label>
      <label class="space-y-2 text-sm md:col-span-2">
        <span class="font-medium text-ink/75">Descricao</span>
        <textarea v-model="form.descricao" rows="4" class="field-input" />
      </label>
      <label class="space-y-2 text-sm">
        <span class="font-medium text-ink/75">Inicio das inscricoes</span>
        <input v-model="form.dataInicioInscricao" type="date" class="field-input" required />
      </label>
      <label class="space-y-2 text-sm">
        <span class="font-medium text-ink/75">Fim das inscricoes</span>
        <input v-model="form.dataFimInscricao" type="date" class="field-input" required />
      </label>
      <label class="space-y-2 text-sm">
        <span class="font-medium text-ink/75">Inicio do programa</span>
        <input v-model="form.dataInicioPrograma" type="date" class="field-input" required />
      </label>
      <label class="space-y-2 text-sm">
        <span class="font-medium text-ink/75">Fim do programa</span>
        <input v-model="form.dataFimPrograma" type="date" class="field-input" required />
      </label>
      <label class="space-y-2 text-sm">
        <span class="font-medium text-ink/75">Vagas totais</span>
        <input v-model.number="form.totalVagas" type="number" min="1" class="field-input" required />
      </label>
      <label class="space-y-2 text-sm">
        <span class="font-medium text-ink/75">Tipo de inscricao</span>
        <select v-model="form.tipoInscricao" class="field-input" required>
          <option value="manual">Manual</option>
          <option value="automatica">Automatica</option>
        </select>
      </label>
    </div>

    <div class="rounded-3xl border border-line/60 bg-white/65 p-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-semibold text-ink">Critérios de elegibilidade</p>
          <p class="text-sm text-ink/65">Adicione faixas de renda, idade e exigências obrigatórias.</p>
        </div>
        <button type="button" class="action-button-secondary" @click="addCriteria">
          Adicionar criterio
        </button>
      </div>

      <div class="mt-4 space-y-4">
        <div
          v-for="(criterion, index) in form.criterios"
          :key="`${criterion.nome}-${index}`"
          class="grid gap-3 rounded-2xl border border-line/50 bg-mist p-4 md:grid-cols-5"
        >
          <input v-model="criterion.nome" class="field-input md:col-span-2" placeholder="Nome do criterio" />
          <select v-model="criterion.tipo" class="field-input">
            <option value="renda">Renda</option>
            <option value="idade">Idade</option>
            <option value="documento">Documento</option>
            <option value="residencia">Residencia</option>
            <option value="escolaridade">Escolaridade</option>
            <option value="outro">Outro</option>
          </select>
          <input v-model="criterion.valorMinimo" class="field-input" placeholder="Valor minimo" />
          <div class="flex gap-2">
            <input v-model="criterion.valorMaximo" class="field-input" placeholder="Valor maximo" />
            <button type="button" class="action-button-secondary" @click="removeCriteria(index)">
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-3">
      <button type="button" class="action-button-secondary" @click="$emit('cancel')">
        Cancelar
      </button>
      <button type="submit" class="action-button-primary">
        Salvar programa
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive } from "vue";

const emit = defineEmits(["submit", "cancel"]);

const form = reactive({
  nome: "",
  descricao: "",
  objetivo: "",
  publicoAlvo: "",
  tipo: "assistencia",
  dataInicioInscricao: "",
  dataFimInscricao: "",
  dataInicioPrograma: "",
  dataFimPrograma: "",
  totalVagas: 100,
  tipoInscricao: "manual",
  localRealizacao: "",
  enderecoRealizacao: "",
  responsavelNome: "",
  responsavelContato: "",
  criterios: [],
});

function addCriteria() {
  form.criterios.push({
    nome: "",
    descricao: "",
    tipo: "renda",
    valorMinimo: "",
    valorMaximo: "",
    obrigatorio: true,
    permiteMultiplasRespostas: false,
    ordem: form.criterios.length,
  });
}

function removeCriteria(index) {
  form.criterios.splice(index, 1);
}

function handleSubmit() {
  emit("submit", {
    ...form,
    criterios: form.criterios.filter((criterion) => criterion.nome),
  });
}
</script>
