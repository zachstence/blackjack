<script lang="ts">
  import { T } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
</script>

<T.PerspectiveCamera makeDefault position={[80, 80, 80]}>
  <OrbitControls />
</T.PerspectiveCamera>

<T.DirectionalLight position={[30, 80, 80]} />
<T.DirectionalLight position={[-30, 80, -80]} intensity={0.2} />
<T.AmbientLight intensity={0.2} />

<slot />
