import axios from 'axios';

export default class Search{
    constructor(query){
        this.query = query;
    }

    async getResults(query) {
        try{
            const result = await axios(`https://forkify-api.herokuapp.com/api/search?&q=${this.query}`);
            this.res = result.data.recipes; 
        }catch(error){
            alert(error);
        }
    }
}
