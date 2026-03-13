# Entradas e Saídas

**GPIOs, LEDs, Botões e o Efeito Bounce**
---

## O que é um GPIO? (General Purpose Input/Output)

* **Revisão:** Na última aula simulamos sensores com variáveis aleatórias. Hoje, vamos ler tensão elétrica real!
* **O Conceito:** GPIOs são os "tentáculos" do microcontrolador RP2040. Pinos que podem ser configurados via software para:
* **Saída (Output):** Enviar energia (3.3V = `HIGH` / 1) ou cortar energia (0V = `LOW` / 0). Ex: Ligar um LED.
* **Entrada (Input):** "Ouvir" se há energia (3.3V) ou não (0V) chegando de fora. Ex: Ler um botão.


---

## O "Hello World" do Hardware

**Configurando uma Saída Digital (Controlando o LED Vermelho)**

* **O Problema:** Como o código faz a eletricidade chegar até o LED RGB da BitDogLab?
* **(SDK):**
1. `gpio_init(PINO)`: Acorda o pino.
2. `gpio_set_dir(PINO, GPIO_OUT)`: Define como saída.
3. `gpio_put(PINO, ESTADO)`: Manda 1 (liga) ou 0 (desliga).


* **Hipótese:** Se usarmos o pino 13 (LED Vermelho) num `while(true)`, o que acontece?

**O Código (Firmware):**

```c
#include "pico/stdlib.h"

#define LED_R_PIN 13 // Pino do LED Vermelho na BitDogLab

int main() {
    gpio_init(LED_R_PIN);
    gpio_set_dir(LED_R_PIN, GPIO_OUT);

    while (true) {
        gpio_put(LED_R_PIN, 1); // Liga o LED
        sleep_ms(500);
        gpio_put(LED_R_PIN, 0); // Desliga o LED
        sleep_ms(500);
    }
}

```

---

# Estrutura do LED RGB 

![LED RGB](https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/LED_-_5mm_Cycling_RGB.jpg/330px-LED_-_5mm_Cycling_RGB.jpg)

https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/The_internal_view_of_a_Cycling_RGB_LED.gif/500px-The_internal_view_of_a_Cycling_RGB_LED.gif

<details> <summary>Desafio</summary> 

Desenvolva o firmware de uma luminária inteligente que utiliza um único botão para navegar entre diferentes modos de iluminação. A luminária possui um LED RGB (composto por três LEDs internos: Vermelho, Verde e Azul) e deve funcionar seguindo uma lógica de estados finitos.

```mermaid
flowchart TD
    Start([Início]) --> Init[Inicializar Pinos<br/>LEDs como Saída<br/>Botão como Entrada Pull-up]
    Init --> Var[passo = 0]
    
    Var --> Loop{Início do Loop}
    
    Loop --> BtnPress{Botão foi<br/>Pressionado?}
    BtnPress -- Não --> Loop
    
    BtnPress -- Sim --> Debounce[Aguardar 50ms<br/>Debounce]
    Debounce --> Confirm{Ainda está<br/>pressionado?}
    
    Confirm -- Não --> Loop
    Confirm -- Sim --> Increment[passo = passo + 1]
    
    Increment --> CheckOverflow{passo > 7?}
    CheckOverflow -- Sim --> ResetPasso[passo = 0]
    CheckOverflow -- Não --> Switch
    ResetPasso --> Switch
    
    subgraph Lógica de Cores
    Switch{Qual o valor<br/>de passo?}
    Switch -- 0 --> C0[Tudo Apagado]
    Switch -- 1 --> C1[Vermelho]
    Switch -- 2 --> C2[Verde]
    Switch -- 3 --> C3[Azul]
    Switch -- 4 --> C4[Amarelo]
    Switch -- 5 --> C5[Ciano]
    Switch -- 6 --> C6[Magenta]
    Switch -- 7 --> C7[Branco]
    end
    
    C0 & C1 & C2 & C3 & C4 & C5 & C6 & C7 --> WaitRelease{Botão ainda<br/>pressionado?}
    
    WaitRelease -- Sim --> Sleep[Aguardar 10ms]
    Sleep --> WaitRelease
    
    WaitRelease -- Não --> Loop
```

</details>
 
---

## Lendo sinais externos

**Ler um Botão (Entrada Digital)**

* **O Problema:** Um botão é apenas um pedaço de metal que une dois fios. Como o RP2040 sabe se ele foi apertado?

<img src="https://polynoteshub.co.in/wp-content/uploads/2025/08/different-types-of-push-buttons-or-switches-1536x1288.jpg" alt="pull-up" width="500">

* **Resistores de Pull-up:** O microcontrolador não gosta de pinos "flutuando". Usamos `gpio_pull_up()` para forçar o pino a ler `HIGH` (1) quando o botão está solto. Quando apertamos, ele conecta ao GND e lê `LOW` (0).

<img src="https://cdn.sparkfun.com/assets/6/f/b/c/7/511568b6ce395f1b40000000.jpg" alt="pull-up" width="500">
  

**Fluxo de Configuração:**

```mermaid
graph LR
    A[gpio_init] --> B[gpio_set_dir como GPIO_IN]
    B --> C[gpio_pull_up]
    C --> D{gpio_get Lê 0?}
    D -- Sim --> E[Botão Pressionado!]
    D -- Não --> F[Botão Solto]

```

---

## Interação Direta

**Botão A (GPIO 5) Controlando o LED Vermelho (GPIO 12)**

* **A Missão:** Juntar o Experimento 1 com a leitura do botão.
* **O Código (Firmware):**

```c
#include "pico/stdlib.h"

#define LED_R_PIN 13
#define BTN_A_PIN 5 // Pino do Botão A na BitDogLab

int main() {
    gpio_init(LED_R_PIN);
    gpio_set_dir(LED_R_PIN, GPIO_OUT);

    gpio_init(BTN_A_PIN);
    gpio_set_dir(BTN_A_PIN, GPIO_IN);
    gpio_pull_up(BTN_A_PIN); 

    while (true) {
        if (gpio_get(BTN_A_PIN) == 0) { 
            gpio_put(LED_R_PIN, 1); // Aperta, liga
        } else {
            gpio_put(LED_R_PIN, 0); // Solta, desliga
        }
    }
}

```

---

## O Efeito Bounce (Repique Mecânico)

* **O Problema:** Dentro do botão há uma mola metálica. Quando apertada, ela "quica" microscopicamente antes de estabilizar.
* **A Consequência:** Para o chip, um aperto humano parece 20 apertos em milissegundos!
* **A Solução (Debounce):** Mandar o código "esperar" uns 50 milissegundos para o contato físico estabilizar.

<img src="https://github.com/isaacmirandaifce/aulasembarcatech2/blob/main/mentorias/imagens/tact_switch.jpg?raw=true" alt="tact" width="500">
<img src="https://github.com/isaacmirandaifce/aulasembarcatech2/blob/main/mentorias/imagens/debounce.png?raw=true" alt="debounce" width="500">


---

## Derrotando o Bounce

**Implementando o Debounce no Código**

* **O Algoritmo de Debounce Simples:**

```mermaid
graph TD
    A[Lê Botão == 0?] --> B{Sim}
    B --> C[sleep_ms 50]
    C --> D[Lê Botão de novo == 0?]
    D -- Sim --> E[Aperto Confirmado! Muda estado do LED]
    D -- Não --> F[Falso Positivo / Ruído]
    E --> G[Aguarda Botão ser solto para evitar repetição contínua]

```

---

## Atividade sugerida

**Máquina de Estados: Botões A/B e Led RGB**

Agora é com vocês!

**Requisitos do Sistema na BitDogLab:**

* **LED RGB:** Vermelho (13), Verde (11) e Azul (12).
* **Botões:** A (5) e B (6).
* **Ação do Botão A:** Pressionado (com Debounce!), avança o estado:
* Estado 0: Todos apagados.
* Estado 1: Liga apenas Vermelho (13).
* Estado 2: Liga apenas Verde (11).
* Estado 3: Liga apenas Azul (12). (Apertar novamente volta pro 0).

* **Ação do Botão B:** Botão de emergência! Quando pressionado, zera a máquina (Estado 0) apagando tudo instantaneamente.

* Fluxograma da atividade

````mermaid
stateDiagram-v2
    %% Definição de estilo
    classDef red fill:#ffcccc,stroke:#000000,stroke-width:2px,color:#000000;
    classDef green fill:#ccffcc,stroke:#000000,stroke-width:2px,color:#000000;
    classDef blue fill:#ccccff,stroke:#000000,stroke-width:2px,color:#000000;
    classDef off fill:#eeeeee,stroke:#000000,stroke-width:2px,color:#000000;

   [*] --> Estado0 : Início do Firmware

    Estado0 : Estado 0 - Todos Apagados
    class Estado0 off
    
    Estado1 : Estado 1 - LED Vermelho ON (12)
    class Estado1 red
    
    Estado2 : Estado 2 - LED Verde ON (13)
    class Estado2 green
    
    Estado3 : Estado 3 - LED Azul ON (11)
    class Estado3 blue

    %% Transições do Botão A (Avança estado)
    Estado0 --> Estado1 : Botão A (GPIO 5)
    Estado1 --> Estado2 : Botão A (GPIO 5)
    Estado2 --> Estado3 : Botão A (GPIO 5)
    Estado3 --> Estado0 : Botão A (GPIO 5)

    %% Transições do Botão B (Emergência)
    Estado1 --> Estado0 : Botão B (Emergência - GPIO 6)
    Estado2 --> Estado0 : Botão B (Emergência - GPIO 6)
    Estado3 --> Estado0 : Botão B (Emergência - GPIO 6)
````
