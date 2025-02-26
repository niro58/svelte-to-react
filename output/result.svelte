
      <script lang="ts">
      import {FileText,Cpu,Database,CheckCircle} from 'lucide-svelte'
const steps = [{icon:FileText,title:"Upload Document",description:"Securely upload your document to our platform.",},{icon:Cpu,title:"AI Analysis",description:"Our advanced AI analyzes the document structure and content.",},{icon:Database,title:"Data Extraction",description:"Key information is extracted and organized into structured data.",},{icon:CheckCircle,title:"Results Delivered",description:"Receive accurate, structured data ready for your use.",},]
const activeStep = $state(0)
const ActiveIcon = steps[activeStep].icon
      </script>
<section id="how-it-works"class="py-20 bg-gray-50">

      <div class="container mx-auto px-4">

        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-blue-900">

          How It Works
        </h2>

        <div class="flex flex-col md:flex-row justify-between items-start">

          <div class="md:w-1/3 mb-8 md:mb-0">

            undefined(< class=onclick=setActiveStep(index)
whileHover={scale:1.03,},>

                < class=>

                <div >

                  <h3 class=>

                    step[].title
                  </h3>

                  <p class=>

                    step[].description
                  </p>

                </div>

              </>
)

          </div>

          <div class="md:w-2/3 bg-white p-8 rounded-lg shadow-lg">

            <AnimatePresence mode="wait">

              < initial={opacity:0,y:20,},animate={opacity:1,y:0,},exit={opacity:0,y:,},transition={duration:0.3,},class="text-center">

                <ActiveIcon class="h-24 w-24 mx-auto mb-6 text-blue-600">

                <h3 class="text-2xl font-bold mb-4 text-blue-900">

                  steps[activeStep].title
                </h3>

                <p class="text-gray-600 mb-6">

                  steps[activeStep].description
                </p>

                <div class="w-full h-2 bg-gray-200 rounded-full">

                  < class="h-full bg-blue-600 rounded-full"initial={width:"0%",},animate={width:,},transition={duration:0.5,},>

                </div>

              </>

            </AnimatePresence>

          </div>

        </div>

      </div>

    </section>

